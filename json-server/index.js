
const cluster = require('cluster');
const os = require('os');
const express = require('express');

// Install RabbitMQ on server
const amqp = require('amqplib/callback_api');

const RABBITMQ_SERVER = 'amqp://localhost';
const QUEUE_NAME = 'json_data_queue';

if (cluster.isMaster) {
    const numCPUs = os.cpus().length;
    console.log(`Master process ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker) => {
        console.log(`Worker ${worker.process.pid} died. Starting a new worker...`);
        cluster.fork();
    });
} else {
    const app = express();
    app.use(express.json({ limit: '50mb' }));

    let channel;

    // Connect to RabbitMQ server and create a channel
    amqp.connect(RABBITMQ_SERVER, function (error0, connection) {
        if (error0) throw error0;
        connection.createChannel(function (error1, ch) {
            if (error1) throw error1;
            channel = ch;
        });
    });

    app.post('/', async (req, res) => {
        // Parse the incoming JSON data.
        const data = req.body;

        // Send data to the queue
        channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(data)));

        res.status(200).send('Data received successfully');
    });

    app.listen(3001, () => {
        console.log(`Server is running on port 3001 and worker ${process.pid} is listening...`);
    });
}

