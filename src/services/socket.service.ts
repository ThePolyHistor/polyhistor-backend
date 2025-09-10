import {Server, Socket} from 'socket.io';
import jwt from 'jsonwebtoken';
import {PrismaClient} from '@prisma/client';
import {ClientToServerEvents, LocationUpdatePayload, ServerToClientEvents, UserLocation} from './socket.types';
import config from '../config';
import {UserPayload} from '../@types/express';

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const prisma = new PrismaClient();

export default class SocketService {
    // @ts-ignore
    private io: IoServer;

    // Cache for throttling location updates: Map<groupId, Map<userId, location>>
    private locationUpdateCache: Map<string, Map<string, UserLocation>> = new Map();
    // Timers for each group's broadcast: Map<groupId, NodeJS.Timeout>
    private throttleTimers: Map<string, NodeJS.Timeout> = new Map();

    public initialize(io: IoServer) {
        this.io = io;
        // Add authentication middleware to Socket.IO
        this.io.use(this.authenticateSocket);
        this.io.on('connection', this.handleConnection);
    }

    private authenticateSocket = (socket: IoSocket, next: (err?: Error) => void) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: Token not provided'));
        }

        try {
            const decoded = jwt.verify(token, config.jwt.secret) as UserPayload;
            // Attach user payload to the socket object for use in event handlers
            (socket as any).user = decoded;
            next();
        } catch (err) {
            return next(new Error('Authentication error: Invalid token'));
        }
    };

    private handleConnection = async (socket: IoSocket) => {
        const userId = (socket as any).user.id;
        console.log(`Authenticated client connected: ${socket.id}, User ID: ${userId}`);

        // Automatically join all groups the user is a member of
        try {
            const memberships = await prisma.groupMember.findMany({
                where: { userId },
                select: { groupId: true },
            });
            memberships.forEach(member => {
                socket.join(`group:${member.groupId}`);
                console.log(`User ${userId} joined room: group:${member.groupId}`);
            });
        } catch (error) {
            console.error('Error joining user to groups:', error);
        }

        // Register event handlers

        socket.on('send-message', (payload) => this.handleSendMessage(socket, payload));
        socket.on('update-location', (payload) => this.handleUpdateLocation(socket, payload));
        socket.on('start-trip', (payload) => this.handleStartTrip(socket, payload));
        socket.on('end-trip', (payload) => this.handleEndTrip(socket, payload));


        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    };

    private handleSendMessage = async (socket: IoSocket, payload: { groupId: string; content: string; }) => {
        const userId = (socket as any).user.id;
        try {
            // 1. Authorization: Check if user is a member of the group
            const member = await prisma.groupMember.findUnique({
                where: { userId_groupId: { userId, groupId: payload.groupId } },
            });
            if (!member) return; // Silently fail if not a member

            // 2. Save message to database
            const message = await prisma.message.create({
                data: {
                    content: payload.content,
                    groupId: payload.groupId,
                    userId: userId,
                },
                include: { user: { select: { id: true, username: true } } },
            });

            // 3. Broadcast to room
            const messagePayload = {
                id: message.id,
                content: message.content,
                createdAt: message.createdAt,
                groupId: message.groupId,
                user: message.user,
            };
            this.io.to(`group:${payload.groupId}`).emit('new-message', messagePayload);
        } catch (error) {
            console.error('Error handling send-message event:', error);
        }
    };

    private handleUpdateLocation = async (socket: IoSocket, payload: LocationUpdatePayload) => {
        const userId = (socket as any).user.id;
        const { groupId, tripId, location } = payload;

        // 1. Get user info
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
        if (!user) return;

        // 2. Update cache
        if (!this.locationUpdateCache.has(groupId)) {
            this.locationUpdateCache.set(groupId, new Map());
        }
        this.locationUpdateCache.get(groupId)!.set(userId, { userId, username: user.username, location });

        // 3. Throttle broadcast
        if (!this.throttleTimers.has(groupId)) {
            const timer = setTimeout(() => {
                const locations = Array.from(this.locationUpdateCache.get(groupId)!.values());
                this.io.to(`group:${groupId}`).emit('locations-update', locations);

                // Cleanup after broadcast
                this.locationUpdateCache.delete(groupId);
                this.throttleTimers.delete(groupId);
            }, 2000); // Broadcast every 2 seconds

            this.throttleTimers.set(groupId, timer);
        }

        // 4. Persist last known location (optional, can be expensive)
        // Consider doing this less frequently or via a separate process
        await prisma.user.update({
            where: { id: userId },
            data: {
                lastLocationLat: location.lat,
                lastLocationLon: location.lon,
            }
        });
    };

    private handleStartTrip = async (socket: IoSocket, payload: { groupId: string; tripId: string; }) => {
        try {
            const trip = await prisma.trip.update({
                where: { id: payload.tripId, groupId: payload.groupId },
                data: { status: 'active' },
            });
            this.io.to(`group:${payload.groupId}`).emit('trip-started', {
                tripId: trip.id,
                groupId: trip.groupId,
                name: trip.name,
            });
        } catch (error) {
            console.error('Error starting trip:', error);
        }
    };

    private handleEndTrip = async (socket: IoSocket, payload: { groupId: string; tripId: string; }) => {
        try {
            const trip = await prisma.trip.update({
                where: { id: payload.tripId, groupId: payload.groupId },
                data: { status: 'ended' },
            });
            this.io.to(`group:${payload.groupId}`).emit('trip-ended', {
                tripId: trip.id,
                groupId: trip.groupId,
            });
        } catch (error) {
            console.error('Error ending trip:', error);
        }
    };
}