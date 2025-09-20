import { NextFunction, Request, Response } from "express";
import { successResponse } from "../../utils/apiResponse";
import AppError from "../../utils/AppError";
import * as usersService from "./users.service";
import { FriendRequestResponseDto } from "./users.types";

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await usersService.getUserById(req.user!.id);
    res.status(200).json(successResponse(user));
  } catch (error) {
    next(error);
  }
};

export const updateProfilePicture = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      throw new AppError("No file uploaded.", 400);
    }
    const user = await usersService.updateProfilePicture(
      req.user!.id,
      req.file.path
    );
    res.status(200).json(successResponse(user));
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await usersService.searchUsers(
      req.query.query as string,
      req.user!.id
    );
    res.status(200).json(successResponse(users));
  } catch (error) {
    next(error);
  }
};

export const sendFriendRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const friendship = await usersService.sendFriendRequest(
      req.user!.id,
      req.body.userId
    );
    res.status(201).json(successResponse(friendship));
  } catch (error) {
    next(error);
  }
};

export const getFriendRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const requests = await usersService.getFriendRequests(req.user!.id);
    res.status(200).json(successResponse(requests));
  } catch (error) {
    next(error);
  }
};

export const respondToFriendRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { status } = req.body as FriendRequestResponseDto;
    const friendship = await usersService.respondToFriendRequest(
      req.user!.id,
      userId,
      status
    );
    res.status(200).json(successResponse(friendship));
  } catch (error) {
    next(error);
  }
};

export const getFriends = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const friends = await usersService.getFriends(req.user!.id);
    res.status(200).json(successResponse(friends));
  } catch (error) {
    next(error);
  }
};

export const removeFriend = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await usersService.removeFriend(req.user!.id, req.params.userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
