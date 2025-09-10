import {TripStatus} from "@prisma/client";

export interface CreateGroupDto {
    name: string;
    description?: string;
    memberIds: string[];
}

export interface UpdateGroupDto {
    name?: string;
    description?: string;
}

export interface AddMemberDto {
    userId: string;
}

export interface CreateTripDto {
    name: string;
    startTime?: Date;
}

export interface UpdateTripDto {
    status: TripStatus;
}