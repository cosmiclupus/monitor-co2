const os = require('os');
const express = require('express');
const amqp = require('amqplib/callback_api');

const RABBITMQ_SERVER = 'amqp://localhost';
const QUEUE_NAME = 'json_data_queue';

const app = express();
app.use(express.json({ limit: '50mb' }));

let channel;

// Connect to RabbitMQ server and create a channel
amqp.connect(RABBITMQ_SERVER, function (error0, connection) {
    if (error0) {
        console.error('Failed to connect to RabbitMQ:', error0);
        return;
    }
    console.log('Connected to RabbitMQ server');

    connection.createChannel(function (error1, ch) {
        if (error1) {
            console.error('Failed to create channel:', error1);
            return;
        }
        console.log('RabbitMQ channel created');
        channel = ch;

        // Assert the queue
        channel.assertQueue(QUEUE_NAME, { durable: false });
    });

    // Handle connection events
    connection.on('error', function (err) {
        console.error('RabbitMQ connection error:', err);
    });

    connection.on('close', function () {
        console.log('RabbitMQ connection closed');
    });
});

// Routes
app.post('/', async (req, res) => {
    try {
        // Log incoming request
        console.log('\nReceived POST request:', new Date().toISOString());

        // Parse the incoming JSON data
        const data = req.body;

        // Check if we have a valid channel
        if (!channel) {
            console.error('RabbitMQ channel not available');
            return res.status(500).send('Server error: Message queue not available');
        }

        // Send data to the queue
        channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(data)));
        console.log('Data sent to queue successfully');

        res.status(200).send('Data received successfully');

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send('Error processing request');
    }
});

// Basic health check endpoint
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Start server
const server = app.listen(3001, '0.0.0.0', () => {
    console.log(`\n=== Server Started ===`);
    console.log(`Test Server is running on port 3001`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Hostname: ${os.hostname()}`);
    console.log('Waiting for data...');
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});