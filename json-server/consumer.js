const amqp = require('amqplib/callback_api');
const express = require('express');
const cors = require('cors');
const MODE_CHANGE_THRESHOLD = 5;
const RABBITMQ_SERVER = 'amqp://localhost';
const QUEUE_NAME = 'json_data_queue';
const METRICS_PORT = 3000;
const MIN_MODE_DURATION = 5; // Tempo mínimo em segundos para validar a mudança de modo
const THRESHOLDS = {
    MIN_DISTANCE: 0.001,     // 1 metro em km
    MIN_SPEED: 0.5,          // 0.5 km/h
    MAX_SPEED_CHANGE: 10,    // máxima variação de velocidade permitida em km/h
    MIN_ACCURACY: 25,        // precisão mínima do GPS em metros
    MAX_INSTANT_SPEED: 30,   // velocidade máxima instantânea permitida em km/h
    STABILIZATION_TIME: 5000 // tempo para estabilização do GPS em ms
};

// State variables
let currentMode = 'rest';
let currentModeStartTime = null;
let potentialNewMode = null;
let potentialNewModeStartTime = null;
let startTime = null;
let lastValidSpeed = 0;
let lastProcessedLocation = null;
let latestValidData = null;
let lastEndpointTimestamp = null;
let stabilizationAttempts = 0;
let timeSeriesData = [];

const CO2_EMISSIONS = {
    rest: 0,
    byFoot: 0,
    bus: 82,
    car: 192
};

let transportCounters = {
    rest: 0,
    byFoot: 0,
    bus: 0,
    car: 0
};

let accumulatedCO2 = {
    rest: 0,
    byFoot: 0,
    bus: 0,
    car: 0
};

const SESSION_ID = Date.now(); // Unique session identifier


function resetCounters() {
    transportCounters = {
        rest: 0,
        byFoot: 0,
        bus: 0,
        car: 0
    };

    accumulatedCO2 = {
        rest: 0,
        byFoot: 0,
        bus: 0,
        car: 0
    };

    startTime = null;
    lastValidSpeed = 0;
    lastProcessedLocation = null;
    latestValidData = null;
    lastEndpointTimestamp = null;
    potentialNewMode = null;
    potentialNewModeStartTime = null;
    currentModeStartTime = null;
    stabilizationAttempts = 0;
    timeSeriesData = [];
}

// Chamar resetCounters na inicialização
resetCounters();

const app = express();
app.use(cors({
    origin: 'http://localhost:4000' // Ajuste para a URL do seu frontend
}));

app.get('/metrics', (req, res) => {
    if (latestValidData) {
        const currentTimestamp = latestValidData.timestamp;
        const currentSpeed = parseFloat(latestValidData.speed);
        const determinedMode = determineTransportMode(currentSpeed);

        if (currentMode !== determinedMode) {
            console.log(`[METRICS] Mode mismatch - Current: ${currentMode}, Determined: ${determinedMode}`);
            currentMode = determinedMode;
            latestValidData.mode = determinedMode;
        }

        // Check if timestamp is different
        if (!lastEndpointTimestamp || currentTimestamp !== lastEndpointTimestamp) {
            lastEndpointTimestamp = currentTimestamp;

            console.log(`[METRICS] Sending response - Mode: ${determinedMode}, Speed: ${currentSpeed}`);

            res.json({
                currentMode: latestValidData.mode,
                currentSpeed: latestValidData.speed,
                timestamp: currentTimestamp,
                coordinates: latestValidData.coordinates,
                transportCounters,
                totalTimeSeconds: Object.values(transportCounters).reduce((a, b) => a + b, 0),
                accumulated: {
                    co2: { ...accumulatedCO2 },
                    totalCO2: Object.values(accumulatedCO2).reduce((a, b) => a + b, 0)
                }
            });
        } else {
            // Retornar valores zerados quando o timestamp for o mesmo
            const emptyCounters = {
                rest: 0,
                byFoot: 0,
                bus: 0,
                car: 0
            };

            res.json({
                currentMode: latestValidData.mode,
                currentSpeed: latestValidData.speed,
                timestamp: currentTimestamp,
                coordinates: latestValidData.coordinates,
                transportCounters: { ...emptyCounters },
                totalTimeSeconds: 0,
                accumulated: {
                    co2: { ...emptyCounters },
                    totalCO2: 0
                }
            });
        }
    } else {
        res.status(204).send();
    }
});

app.listen(METRICS_PORT, () => {
    console.log(`Metrics endpoint available at http://localhost:${METRICS_PORT}/metrics`);
});

const MAX_STABILIZATION_ATTEMPTS = 10;

function isValidMovement(currentTime, distance, calculatedSpeed, locationData) {
    if (!startTime) {
        startTime = currentTime;
        return false;
    }

    if (currentTime - startTime < THRESHOLDS.STABILIZATION_TIME) {
        stabilizationAttempts++;
        console.log(`Awaiting GPS stabilization... Attempt ${stabilizationAttempts}`);
        if (stabilizationAttempts >= MAX_STABILIZATION_ATTEMPTS) {
            console.log("Max stabilization attempts reached. Proceeding with caution.");
            return true;
        }
        return false;
    }

    stabilizationAttempts = 0;

    const horizontalAccuracy = parseFloat(locationData.horizontalAccuracy || locationData.values.horizontalAccuracy);
    if (horizontalAccuracy > THRESHOLDS.MIN_ACCURACY) {
        console.log(`Insufficient GPS precision: ${horizontalAccuracy}m`);
        return false;
    }

    const speedChange = Math.abs(calculatedSpeed - lastValidSpeed);
    const maxAllowedSpeedChange = Math.max(THRESHOLDS.MAX_SPEED_CHANGE, lastValidSpeed * 0.5);
    if (speedChange > maxAllowedSpeedChange) {
        console.log(`Significant speed variation: ${speedChange.toFixed(2)} km/h`);
        return false;
    }

    if (calculatedSpeed > THRESHOLDS.MAX_INSTANT_SPEED) {
        console.log(`Instantaneous speed too high: ${calculatedSpeed.toFixed(2)} km/h`);
        return false;
    }

    lastValidSpeed = calculatedSpeed;
    return true;
}

function calculateCO2Emission(mode, distance) {
    return CO2_EMISSIONS[mode] * distance;
}


function processLocation(locationData) {
    try {
        const currentTime = parseInt(locationData.time) / 1000000;
        const coords = {
            latitude: parseFloat(locationData.latitude || locationData.values.latitude),
            longitude: parseFloat(locationData.longitude || locationData.values.longitude)
        };

        let calculatedSpeed = 0;
        let distance = 0;

        if (lastProcessedLocation !== null) {
            distance = calculateDistance(
                lastProcessedLocation.coords.latitude,
                lastProcessedLocation.coords.longitude,
                coords.latitude,
                coords.longitude
            );

            const timeDiff = locationData.seconds_elapsed ?
                parseFloat(locationData.seconds_elapsed) / 3600 :
                (currentTime - lastProcessedLocation.time);

            if (timeDiff > 0) {
                calculatedSpeed = locationData.speed ?
                    parseFloat(locationData.speed) :
                    distance / timeDiff;

                console.log(`[PROCESS] Calculated speed: ${calculatedSpeed} km/h`);

                if (isValidMovement(currentTime, distance, calculatedSpeed, locationData)) {
                    // Determine o modo correto baseado na velocidade
                    const correctMode = determineTransportMode(calculatedSpeed);

                    // Atualize latestValidData com o modo correto
                    console.log("latesValidData em processLocation", latestValidData)
                    latestValidData = {
                        mode: correctMode,
                        speed: calculatedSpeed,
                        timestamp: currentTime,
                        coordinates: coords
                    };

                    console.log(`[PROCESS] Mode determination: Speed ${calculatedSpeed} km/h -> Mode ${correctMode}`);

                    // Atualizar contadores somente se houver mudança de modo
                    if (currentMode !== correctMode) {
                        const elapsedSeconds = Math.round(currentTime - (currentModeStartTime || currentTime));
                        transportCounters[currentMode] += elapsedSeconds;

                        console.log(`[PROCESS] Mode change: ${currentMode} -> ${correctMode}`);
                        currentMode = correctMode;
                        currentModeStartTime = currentTime;
                    }

                    // Calcular CO2 para o modo atual
                    const co2Emitted = calculateCO2Emission(currentMode, distance);
                    accumulatedCO2[currentMode] += co2Emitted;

                    console.log(`[PROCESS] CO2 update for ${currentMode}: ${co2Emitted.toFixed(2)}g`);
                }
            }
        } else {
            // Primeira localização - inicializar com modo baseado na velocidade
            const initialMode = determineTransportMode(calculatedSpeed);
            currentMode = initialMode;
            currentModeStartTime = currentTime;

            latestValidData = {
                mode: initialMode,
                speed: calculatedSpeed,
                timestamp: currentTime,
                coordinates: coords
            };
        }

        lastProcessedLocation = {
            time: currentTime,
            coords: coords
        };

    } catch (error) {
        console.error('Error processing location:', error);
    }
}

function determineTransportMode(speedKmh) {
    // Convert to number and ensure valid value
    speedKmh = Number(speedKmh);

    console.log(`[MODE DETERMINATION] Speed: ${speedKmh} km/h`);

    if (isNaN(speedKmh) || speedKmh < 0) {
        console.log('[MODE DETERMINATION] Invalid speed, defaulting to rest');
        return 'rest';
    }

    let mode;
    if (speedKmh <= 1) {
        mode = 'rest';
    } else if (speedKmh <= 13) {
        mode = 'byFoot';
    } else if (speedKmh <= 30) { // Removido o >= 16.35 para cobrir o gap
        mode = 'bus';
    } else {
        mode = 'car';
    }

    console.log(`[MODE DETERMINATION] Determined mode: ${mode}`);
    return mode;
}


function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}


function generateTimeSeriesData() {
    const currentTime = Date.now() / 1000;
    const elapsedSeconds = Math.floor(currentTime - startTime);

    // Ensure the timeSeriesData array is up to date
    while (timeSeriesData.length < elapsedSeconds + 1) {
        timeSeriesData.push({
            timestamp: startTime + timeSeriesData.length,
            rest: 0,
            byFoot: 0,
            bus: 0,
            car: 0
        });
    }

    // Set the current mode in the latest data point
    const latestDataPoint = timeSeriesData[timeSeriesData.length - 1];
    latestDataPoint[currentMode] = 1;

    return timeSeriesData;
}

const MAX_TIME_SERIES_LENGTH = 3600; // Store data for up to 1 hour

function updateTimeSeriesData(currentTime, mode) {
    try {
        const elapsedSeconds = Math.floor((currentTime * 1000000 - startTime) / 1000);

        // Trim old data more aggressively
        if (timeSeriesData.length >= MAX_TIME_SERIES_LENGTH) {
            const trimAmount = Math.floor(MAX_TIME_SERIES_LENGTH / 2);
            timeSeriesData = timeSeriesData.slice(-trimAmount);
            startTime = timeSeriesData[0].timestamp;
        }

        // Add new data points
        while (timeSeriesData.length < Math.min(elapsedSeconds + 1, MAX_TIME_SERIES_LENGTH)) {
            timeSeriesData.push({
                timestamp: startTime + timeSeriesData.length * 1000,
                rest: 0,
                byFoot: 0,
                bus: 0,
                car: 0
            });
        }

        timeSeriesData[timeSeriesData.length - 1][mode] = 1;
        console.log(`Updated time series data: ${timeSeriesData.length} points, latest mode: ${mode}`);
    } catch (error) {
        console.error('Error updating time series data:', error);
    }
}

amqp.connect(RABBITMQ_SERVER, function (error0, connection) {
    if (error0) {
        console.error('Error connecting to RabbitMQ:', error0);
        return;
    }
    console.log('Connected to RabbitMQ');

    connection.createChannel(function (error1, channel) {
        if (error1) {
            console.error('Error creating channel:', error1);
            return;
        }

        channel.assertQueue(QUEUE_NAME, {
            durable: false
        });

        console.log(`Waiting for messages in ${QUEUE_NAME}. To exit press CTRL+C`);

        channel.consume(QUEUE_NAME, function (msg) {
            try {
                const data = JSON.parse(msg.content.toString());
                let locationData;

                if (Array.isArray(data.payload)) {
                    locationData = data.payload.find(item => item.sensor === "Location" || item.name === "location");
                } else {
                    locationData = data.payload.filter(item => item.name === 'location');
                }

                if (locationData) {
                    processLocation(locationData);
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        }, {
            noAck: true
        });

        const gc = (global.gc || (() => { }));
        setInterval(() => {
            gc();
            console.log('Garbage collection performed');
        }, 60000); // Run every 5 minutes

        process.on('SIGINT', () => {
            console.log('\nShutting down consumer...');
            resetCounters();
            process.exit(0);
        });

    });
});