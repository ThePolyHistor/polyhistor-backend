import {FriendshipStatus} from '@prisma/client';

/**
 * Defines the shape of the request body for responding to a friend request.
 * We only allow a subset of the FriendshipStatus enum for this action.
 */
export interface FriendRequestResponseDto {
    status: Extract<FriendshipStatus, 'accepted' | 'blocked'>;
}