import {PrismaClient} from '@prisma/client';
import AppError from '../../utils/AppError';
import {CreateGroupDto, CreateTripDto, UpdateGroupDto, UpdateTripDto} from './groups.types';

const prisma = new PrismaClient();

// --- Authorization Helpers ---
const checkGroupMembership = async (userId: string, groupId: string) => {
    const membership = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId } },
    });
    if (!membership) {
        throw new AppError('You are not a member of this group.', 403);
    }
    return membership;
};

const checkGroupAdmin = async (userId: string, groupId: string) => {
    const membership = await checkGroupMembership(userId, groupId);
    if (membership.role !== 'admin') {
        throw new AppError('You do not have permission to perform this action.', 403);
    }
};

// --- Service Functions ---

export const createGroup = async (ownerId: string, groupData: CreateGroupDto) => {
    const { name, description, memberIds } = groupData;

    // Ensure all provided member IDs exist and are friends (optional but good practice)
    // For simplicity, this is omitted here but would be a good addition.

    const uniqueMemberIds = [...new Set([ownerId, ...memberIds])];

    return prisma.$transaction(async (tx) => {
        const newGroup = await tx.group.create({
            data: {
                name,
                description,
                ownerId,
            },
        });

        await tx.groupMember.createMany({
            data: uniqueMemberIds.map(userId => ({
                groupId: newGroup.id,
                userId: userId,
                role: userId === ownerId ? 'admin' : 'member',
            })),
        });

        return newGroup;
    });
};

export const getUserGroups = (userId: string) => {
    return prisma.group.findMany({
        where: { members: { some: { userId } } },
    });
};

export const getGroupDetails = async (userId: string, groupId: string) => {
    await checkGroupMembership(userId, groupId);
    return prisma.group.findUnique({
        where: { id: groupId },
        include: {
            members: {
                select: {
                    user: { select: { id: true, username: true } },
                    role: true,
                },
            },
        },
    });
};

export const updateGroup = async (userId: string, groupId: string, updateData: UpdateGroupDto) => {
    await checkGroupAdmin(userId, groupId);
    return prisma.group.update({
        where: { id: groupId },
        data: updateData,
    });
};

export const deleteGroup = async (userId: string, groupId: string) => {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group || group.ownerId !== userId) {
        throw new AppError('Only the group owner can delete the group.', 403);
    }
    await prisma.group.delete({ where: { id: groupId } });
};

export const addMember = async (adminId: string, groupId: string, userIdToAdd: string) => {
    await checkGroupAdmin(adminId, groupId);
    return prisma.groupMember.create({
        data: { userId: userIdToAdd, groupId, role: 'member' },
    });
};

export const removeMember = async (requesterId: string, groupId: string, userIdToRemove: string) => {
    if (requesterId !== userIdToRemove) {
        await checkGroupAdmin(requesterId, groupId);
    }
    const member = await prisma.groupMember.findUniqueOrThrow({
        where: { userId_groupId: { userId: userIdToRemove, groupId } },
        include: { group: true }
    });
    // Prevent owner from being removed
    if (member.group.ownerId === userIdToRemove) {
        throw new AppError('The group owner cannot be removed.', 400);
    }
    await prisma.groupMember.delete({
        where: { userId_groupId: { userId: userIdToRemove, groupId } },
    });
};

export const createTrip = async (userId: string, groupId: string, tripData: CreateTripDto) => {
    await checkGroupMembership(userId, groupId);
    return prisma.trip.create({
        data: { ...tripData, groupId },
    });
};

export const getTripsForGroup = async (userId: string, groupId: string) => {
    await checkGroupMembership(userId, groupId);
    return prisma.trip.findMany({
        where: { groupId },
        orderBy: { createdAt: 'desc' },
    });
};

export const updateTripStatus = async (userId: string, groupId: string, tripId: string, tripData: UpdateTripDto) => {
    await checkGroupAdmin(userId, groupId);
    return prisma.trip.update({
        where: { id: tripId, groupId },
        data: { status: tripData.status },
    });
};

export const getGroupMessages = async (userId: string, groupId: string, page: number = 1, limit: number = 20) => {
    await checkGroupMembership(userId, groupId);
    const skip = (page - 1) * limit;

    const [messages, totalMessages] = await prisma.$transaction([
        prisma.message.findMany({
            where: { groupId },
            include: { user: { select: { id: true, username: true } } },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: skip,
        }),
        prisma.message.count({ where: { groupId } }),
    ]);

    return {
        messages: messages.reverse(), // Show oldest first for the page
        currentPage: page,
        totalPages: Math.ceil(totalMessages / limit),
    };
};