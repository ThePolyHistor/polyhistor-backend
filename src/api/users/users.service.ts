import { FriendshipStatus, PrismaClient } from "@prisma/client";
import AppError from "../../utils/AppError";

const prisma = new PrismaClient();

// Helper to exclude fields from an object (e.g., passwordHash)
function exclude<User, Key extends keyof User>(
  user: User,
  keys: Key[]
): Omit<User, Key> {
  for (let key of keys) {
    delete user[key];
  }
  return user;
}

export const updateProfilePicture = async (
  userId: string,
  filePath: string
) => {
  // filePath is the absolute path, we need to convert it to a URL
  const fileName = filePath.split("uploads/")[1];
  const profilePictureUrl = `/uploads/${fileName}`;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { profilePictureUrl },
  });

  return exclude(user, ["passwordHash", "refreshToken"]);
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return exclude(user, ["passwordHash"]);
};

export const searchUsers = async (query: string, currentUserId: string) => {
  const users = await prisma.user.findMany({
    where: {
      username: {
        contains: query,
        mode: "insensitive",
      },
      id: {
        not: currentUserId,
      },
    },
    select: { id: true, username: true },
    take: 10,
  });
  return users;
};

export const sendFriendRequest = async (
  senderId: string,
  receiverId: string
) => {
  if (senderId === receiverId) {
    throw new AppError("You cannot send a friend request to yourself.", 400);
  }
  // Ensure the friendship is always stored with the smaller ID first for consistency
  const [userOneId, userTwoId] = [senderId, receiverId].sort();

  const existingFriendship = await prisma.friendship.findUnique({
    where: { userOneId_userTwoId: { userOneId, userTwoId } },
  });
  if (existingFriendship) {
    throw new AppError(
      "Friend request already sent or you are already friends.",
      409
    );
  }
  return prisma.friendship.create({
    data: {
      userOneId,
      userTwoId,
      status: "pending",
      actionUserId: senderId,
    },
  });
};

export const getFriendRequests = async (userId: string) => {
  return prisma.friendship.findMany({
    where: {
      status: "pending",
      // The request is for me if I am one of the users, but I am NOT the action user
      actionUserId: { not: userId },
      OR: [{ userOneId: userId }, { userTwoId: userId }],
    },
    include: {
      actionUser: { select: { id: true, username: true } }, // Show who sent the request
    },
  });
};

export const respondToFriendRequest = async (
  responderId: string,
  requesterId: string,
  status: FriendshipStatus
) => {
  const [userOneId, userTwoId] = [responderId, requesterId].sort();

  const friendship = await prisma.friendship.findUnique({
    where: { userOneId_userTwoId: { userOneId, userTwoId } },
  });

  if (
    !friendship ||
    friendship.status !== "pending" ||
    friendship.actionUserId === responderId
  ) {
    throw new AppError("Friend request not found or already handled.", 404);
  }
  return prisma.friendship.update({
    where: { userOneId_userTwoId: { userOneId, userTwoId } },
    data: {
      status,
      actionUserId: responderId,
    },
  });
};

export const getFriends = async (userId: string) => {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "accepted",
      OR: [{ userOneId: userId }, { userTwoId: userId }],
    },
    include: {
      userOne: { select: { id: true, username: true } },
      userTwo: { select: { id: true, username: true } },
    },
  });
  // Return the other user in the friendship, not myself
  return friendships.map((f) =>
    f.userOneId === userId ? f.userTwo : f.userOne
  );
};

export const removeFriend = async (removerId: string, friendId: string) => {
  const [userOneId, userTwoId] = [removerId, friendId].sort();

  return prisma.friendship.delete({
    where: {
      userOneId_userTwoId: { userOneId, userTwoId },
      // Optional: check if they are actually friends before deleting
      status: "accepted",
    },
  });
};
