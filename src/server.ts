import http from 'http';
import {Server} from 'socket.io';
import {createAdapter} from '@socket.io/redis-adapter';
import {createClient} from 'redis';
import app from './app';
import config from './config';
import SocketService from './services/socket.service';

// Create an HTTP server
const httpServer = http.createServer(app);

// Setup Redis clients for Socket.IO adapter
const pubClient = createClient({ url: `redis://${config.redis.host}:${config.redis.port}` });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    // Create Socket.IO server
    const io = new Server(httpServer, {
        cors: {
            origin: config.corsOrigin,
            methods: ['GET', 'POST'],
        },
        adapter: createAdapter(pubClient, subClient),
    });

    // Initialize Socket Service
    const socketService = new SocketService();
    socketService.initialize(io);
    console.log('Socket.IO initialized with Redis adapter 🚀');

    // Start listening
    httpServer.listen(config.port, () => {
        console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });
}).catch(err => {
    console.error('Failed to connect to Redis', err);
    process.exit(1);
});