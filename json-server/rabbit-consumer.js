const amqp = require('amqplib/callback_api');

const RABBITMQ_SERVER = 'amqp://localhost';
const QUEUE_NAME = 'json_data_queue';

// Connect to RabbitMQ server
amqp.connect(RABBITMQ_SERVER, function (error0, connection) {
  if (error0) throw error0;

  // Create a channel
  connection.createChannel(function (error1, channel) {
    if (error1) throw error1;

    // Assert the queue
    channel.assertQueue(QUEUE_NAME, { durable: false });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", QUEUE_NAME);

    // Consume messages from the queue
    channel.consume(QUEUE_NAME, function (msg) {
      try {
        let data = JSON.parse(msg.content.toString());

        if (Array.isArray(data)) {
          data.forEach(entry => {
            let output = {
              name: entry.sensor.toLowerCase(),
              values: {}
            };

            // Process based on sensor type
            switch (entry.sensor) {
              case 'Accelerometer':
              case 'AccelerometerUncalibrated':
                output.values = {
                  x: parseFloat(entry.x),
                  y: parseFloat(entry.y),
                  z: parseFloat(entry.z)
                };
                break;

              case 'Location':
                output.values = {
                  lat: parseFloat(entry.latitude),
                  lon: parseFloat(entry.longitude),
                  alt: parseFloat(entry.altitude)
                };
                break;
            }

            // Only print if we have some values
            if (Object.keys(output.values).length > 0) {
              console.log(JSON.stringify(output, null, 2));
            }
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }, {
      noAck: true
    });
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down consumer...');
  process.exit(0);
});