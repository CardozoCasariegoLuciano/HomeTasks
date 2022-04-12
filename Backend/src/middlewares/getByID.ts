import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import Invitation from "../models/invitation.model";
import Task from "../models/task.model";
import Activity from "../models/activity.model";
import Calendar from "../models/calendar.model";
import ToDo from "../models/tasktoDo.model";
import { objectID_validation } from "./validation/objectID.validation";

export const getUserByID = async ( req: Request, res: Response, next: NextFunction, id: string) => {
  try {
    await objectID_validation.validateAsync({ id });
    const user = await User.findById(id).select({ password: 0 });

    if (!user) {
      return res.status(400).json({ Message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const getCalendarByID = async ( req: Request, res: Response, next: NextFunction, id: string) => {
  try {
    const JoiResp = await objectID_validation.validateAsync({ id });
    //if (JoiResp.error) {
      //return res
      //.status(400)
      //.json({ Message: "Something went wrong", Error: JoiResp.error });
    //}

    const calendar = await Calendar.findById(id).populate("founder", "name email _id")

    if (!calendar) {
      return res.status(400).json({ Message: "Calendar not found" });
    }

    req.calendar = calendar
    next();
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const getInvitationByID = async ( req: Request, res: Response, next: NextFunction, id: string) => {
  try {
    await objectID_validation.validateAsync({ id });
    const invi = await Invitation.findById(id)

    if (!invi) {
      return res.status(400).json({ Message: "Invitation not found" });
    }

    req.invitation = invi;
    next();
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const getTaskByID = async ( req: Request, res: Response, next: NextFunction, id: string) => {
  try {
    await objectID_validation.validateAsync({ id });
    const task = await Task.findById(id)

    if (!task) {
      return res.status(400).json({ Message: "Taks not found" });
    }

    req.task = task;
    next();
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const getActivityByID = async ( req: Request, res: Response, next: NextFunction, id: string) => {
  try {
    await objectID_validation.validateAsync({ id });
    const activity = await Activity.findById(id)

    if (!activity) {
      return res.status(400).json({ Message: "Taks not found" });
    }

    req.activity = activity;
    next();
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const getToDoByID = async ( req: Request, res: Response, next: NextFunction, id: string) => {
  try {
    await objectID_validation.validateAsync({ id });
    const todo = await ToDo.findById(id)

    if (!todo) {
      return res.status(400).json({ Message: "Taks not found" });
    }

    req.todo = todo;
    next();
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};
