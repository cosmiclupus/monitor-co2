/**
 * Analisador de transporte com acumulação de CO2
 */

// Constantes de emissão de CO2 (gramas por km)
const CO2_EMISSIONS = {
  rest: 0,      // Repouso não emite CO2
  byFoot: 0,    // A pé não emite CO2
  bus: 82,      // Ônibus - média por passageiro
  car: 192      // Carro médio à gasolina
};

// Acumuladores globais
let accumulatedStats = {
  distances: {
    rest: 0,
    byFoot: 0,
    bus: 0,
    car: 0
  },
  co2: {
    rest: 0,
    byFoot: 0,
    bus: 0,
    car: 0,
    total: 0
  },
  counts: {
    rest: 0,
    byFoot: 0,
    bus: 0,
    car: 0
  },
  startTime: null
};

function analyzeTransportMode(locationData) {
  // Inicializar tempo de início se necessário
  if (!accumulatedStats.startTime && locationData.length > 0) {
    accumulatedStats.startTime = new Date(parseInt(locationData[0].time / 1000000));
  }

  // Processar novo ponto
  const currentPoint = locationData[locationData.length - 1];
  if (currentPoint && currentPoint.sensor === "Location") {
    const speedKmh = currentPoint.speed === "-1" ? 0 : parseFloat(currentPoint.speed) * 3.6;
    const transportMode = determineTransportMode(speedKmh);

    // Incrementar contador do modo
    accumulatedStats.counts[transportMode]++;

    // Calcular distância se houver ponto anterior
    if (locationData.length > 1) {
      const prevPoint = locationData[locationData.length - 2];
      const distance = calculateDistance(
        parseFloat(prevPoint.latitude),
        parseFloat(prevPoint.longitude),
        parseFloat(currentPoint.latitude),
        parseFloat(currentPoint.longitude)
      );

      // Acumular distância
      accumulatedStats.distances[transportMode] += distance;

      // Calcular e acumular CO2
      const co2Emitted = distance * CO2_EMISSIONS[transportMode];
      accumulatedStats.co2[transportMode] += co2Emitted;
      accumulatedStats.co2.total += co2Emitted;
    }

    return {
      current: {
        timestamp: new Date(parseInt(currentPoint.time / 1000000)).toISOString(),
        movement: {
          speed: speedKmh,
          transportMode: transportMode
        },
        location: {
          latitude: parseFloat(currentPoint.latitude),
          longitude: parseFloat(currentPoint.longitude)
        }
      },
      accumulated: {
        ...accumulatedStats,
        elapsedTime: accumulatedStats.startTime ?
          (new Date() - accumulatedStats.startTime) / 1000 / 60 : 0, // em minutos
        formattedCO2: {
          rest: formatCO2(accumulatedStats.co2.rest),
          byFoot: formatCO2(accumulatedStats.co2.byFoot),
          bus: formatCO2(accumulatedStats.co2.bus),
          car: formatCO2(accumulatedStats.co2.car),
          total: formatCO2(accumulatedStats.co2.total)
        }
      }
    };
  }

  return null;
}

function formatCO2(grams) {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)} kg`;
  }
  return `${grams.toFixed(2)} g`;
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
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * Math.PI / 180;
}

function resetAccumulators() {
  accumulatedStats = {
    distances: { rest: 0, byFoot: 0, bus: 0, car: 0 },
    co2: { rest: 0, byFoot: 0, bus: 0, car: 0, total: 0 },
    counts: { rest: 0, byFoot: 0, bus: 0, car: 0 },
    startTime: null
  };
}

module.exports = { analyzeTransportMode, resetAccumulators };