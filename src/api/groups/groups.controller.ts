import { NextFunction, Request, Response } from "express";
import { successResponse } from "../../utils/apiResponse";
import * as groupsService from "./groups.service";
import {
  AddMemberDto,
  CreateGroupDto,
  CreateTripDto,
  UpdateGroupDto,
  UpdateTripDto,
} from "./groups.types";

export const createGroup = async (
  req: Request<{}, {}, CreateGroupDto>,
  res: Response,
  next: NextFunction
) => {
  try {
    const group = await groupsService.createGroup(req.user!.id, req.body);
    res.status(201).json(successResponse(group));
  } catch (error) {
    next(error);
  }
};

export const getUserGroups = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const groups = await groupsService.getUserGroups(req.user!.id);
    res.status(200).json(successResponse(groups));
  } catch (error) {
    next(error);
  }
};

export const getGroupDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const group = await groupsService.getGroupDetails(
      req.user!.id,
      req.params.groupId
    );
    res.status(200).json(successResponse(group));
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (
  req: Request<{ groupId: string }, {}, UpdateGroupDto>,
  res: Response,
  next: NextFunction
) => {
  try {
    const group = await groupsService.updateGroup(
      req.user!.id,
      req.params.groupId,
      req.body
    );
    res.status(200).json(successResponse(group));
  } catch (error) {
    next(error);
  }
};

export const deleteGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await groupsService.deleteGroup(req.user!.id, req.params.groupId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addMember = async (
  req: Request<{ groupId: string }, {}, AddMemberDto>,
  res: Response,
  next: NextFunction
) => {
  try {
    const member = await groupsService.addMember(
      req.user!.id,
      req.params.groupId,
      req.body.userId
    );
    res.status(201).json(successResponse(member));
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (
  req: Request<{ groupId: string; userId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    await groupsService.removeMember(
      req.user!.id,
      req.params.groupId,
      req.params.userId
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const createTrip = async (
  req: Request<{ groupId: string }, {}, CreateTripDto>,
  res: Response,
  next: NextFunction
) => {
  try {
    const trip = await groupsService.createTrip(
      req.user!.id,
      req.params.groupId,
      req.body
    );
    res.status(201).json(successResponse(trip));
  } catch (error) {
    next(error);
  }
};

export const getTripsForGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const trips = await groupsService.getTripsForGroup(
      req.user!.id,
      req.params.groupId
    );
    res.status(200).json(successResponse(trips));
  } catch (error) {
    next(error);
  }
};

export const updateTripStatus = async (
  req: Request<{ groupId: string; tripId: string }, {}, UpdateTripDto>,
  res: Response,
  next: NextFunction
) => {
  try {
    const trip = await groupsService.updateTripStatus(
      req.user!.id,
      req.params.groupId,
      req.params.tripId,
      req.body
    );
    res.status(200).json(successResponse(trip));
  } catch (error) {
    next(error);
  }
};

export const getGroupMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Provide default values here to prevent NaN
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await groupsService.getGroupMessages(
      req.user!.id,
      req.params.groupId,
      page,
      limit
    );
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
};
