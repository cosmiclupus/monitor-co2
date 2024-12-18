const amqp = require('amqplib/callback_api');

function publishMockedData(duration, callback) {
  const intervalDuration = 1000; // 1 segundo
  const totalIntervals = duration / intervalDuration;
  const SPEED_INCREMENT_INTERVAL = 5; // 5 segundos

  let currentLat = -16.65928313426527;
  let currentLon = -49.26441851936153;
  let currentSpeed = 0;
  let currentTime = Math.floor(Date.now() * 1000);
  let lastTimestamp = null;

  amqp.connect('amqp://localhost', (err, connection) => {
    if (err) {
      console.error('Erro ao conectar ao RabbitMQ:', err);
      callback(err);
      return;
    }

    connection.createChannel((err, channel) => {
      if (err) {
        console.error('Erro ao criar o canal:', err);
        callback(err);
        return;
      }

      const queue = 'json_data_queue';
      let count = 0;

      const intervalId = setInterval(() => {
        // Calcular a velocidade baseada no número de intervalos de 5 segundos
        currentSpeed = Math.floor(count / SPEED_INCREMENT_INTERVAL) * 5;

        if (currentTime !== lastTimestamp) {
          const mockedData = {
            messageId: count + 1,
            sessionId: 'ebbebfe4-84b4-4e1e-90c1-ebfe72ec4c57',
            deviceId: '398c27a6-502c-42e3-a379-f9cfadc0ad10',
            payload: [
              {
                name: 'accelerometer',
                time: currentTime,
                values: {}
              },
              {
                name: 'accelerometeruncalibrated',
                time: currentTime + 11192100,
                values: {}
              },
              {
                name: 'accelerometer',
                time: currentTime + 9947900,
                values: {}
              },
              {
                speed: currentSpeed.toFixed(2),
                bearing: "-1",
                sensor: "Location",
                bearingAccuracy: "-1",
                longitude: currentLon.toFixed(8),
                time: currentTime.toString(),
                latitude: currentLat.toFixed(8),
                verticalAccuracy: "4",
                altitudeAboveMeanSeaLevel: "711.8149347305298",
                speedAccuracy: "0.9100000262260437",
                altitude: "702.3826904296875",
                seconds_elapsed: count.toString(),
                horizontalAccuracy: "3.5334769009933575"
              }
            ]
          };

          const message = JSON.stringify(mockedData);
          channel.sendToQueue(queue, Buffer.from(message));
          console.log('Published:', {
            timestamp: currentTime,
            speed: currentSpeed,
            count: count
          });

          lastTimestamp = currentTime;
        }

        currentLat += 0.0001;
        currentLon += 0.0001;
        currentTime = Math.floor(Date.now() * 1000);

        count++;

        if (count >= totalIntervals) {
          clearInterval(intervalId);
          connection.close();
          callback(null);
        }
      }, intervalDuration);
    });
  });
}

const duration = 50000;

publishMockedData(duration, (err) => {
  if (err) {
    console.error('Error during data publishing:', err);
    process.exit(1);
  } else {
    console.log('Mock data publishing completed successfully!');
  }
});

module.exports = publishMockedData;