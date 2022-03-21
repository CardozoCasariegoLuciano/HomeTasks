import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import Invitation from "../models/invitation.model";
import Calendar from "../models/calendar.model";
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
    await objectID_validation.validateAsync({ id });
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
