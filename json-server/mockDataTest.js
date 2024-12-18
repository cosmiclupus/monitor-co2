const express = require('express');
const amqp = require('amqplib/callback_api');
const publishMockedData = require('./mockDataPublisher');

const RABBITMQ_SERVER = 'amqp://localhost';
const QUEUE_NAME = 'json_data_queue';

const app = express();

let channel;

// Connect to RabbitMQ server and create a channel
amqp.connect(RABBITMQ_SERVER, function (error0, connection) {
  if (error0) throw error0;
  connection.createChannel(function (error1, ch) {
    if (error1) throw error1;
    channel = ch;
  });

  // Start publishing mocked data
  const duration = 30000; // 30 seconds
  publishMockedData(duration, (err) => {
    if (err) {
      console.error('Error during data publishing:', err);
    } else {
      console.log('Mocked data publishing completed successfully!');
    }
  });
});

app.listen(3002, () => {
  console.log('Mock data test server is running on port 3002');
});