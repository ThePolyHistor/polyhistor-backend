// --- Reusable Type Definitions ---

/** Defines the geographic location structure. */
export interface Location {
    lat: number;
    lon: number;
}

/** Defines the payload for a single user's location update. */
export interface UserLocation {
    userId: string;
    username: string;
    location: Location;
}

/** Defines the full payload for the client's periodic location update. */
export interface LocationUpdatePayload {
    groupId: string;
    tripId: string;
    location: Location;
}


// --- Socket.IO Event Interfaces ---

/**
 * Defines all events the server can send to the client.
 * The client will listen for these events.
 */
export interface ServerToClientEvents {
    'new-message': (payload: {
        id: string;
        content: string;
        createdAt: Date;
        groupId: string;
        user: { id: string; username: string };
    }) => void;

    'locations-update': (payload: UserLocation[]) => void;

    'trip-started': (payload: {
        tripId: string;
        groupId: string;
        name: string
    }) => void;

    'trip-ended': (payload: {
        tripId: string;
        groupId: string;
    }) => void;
}

/**
 * Defines all events the client can send to the server.
 * The server will listen for these events.
 */
export interface ClientToServerEvents {
    'send-message': (payload: {
        groupId: string;
        content: string;
    }) => void;

    'update-location': (payload: LocationUpdatePayload) => void;

    'start-trip': (payload: {
        groupId: string;
        tripId: string;
    }) => void;

    'end-trip': (payload: {
        groupId: string;
        tripId: string;
    }) => void;
}