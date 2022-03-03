import { Request, Response } from "express";
import Calendar, { ICalendar } from "../models/calendar.model";
import User, { IUser } from "../models/user.model";
import Invitation from "../models/invitation.model";
import {
  calendar_add_validation,
  calendar_validation,
} from "./validations/calendar.validation";
import mongoose from "mongoose";

//Functions
const isFounder = (userId: string, calendar: any) => {
  return userId === calendar.founder._id.toString();
};

const isFounderOrAdmin = (userId: string, calendar: any) => {
  const userID = new mongoose.Types.ObjectId(userId);
  return calendar.members.includes(userID) || calendar.admins.includes(userID);
};

const wasAlreadyInvited = async ( user: IUser, calendar: ICalendar): Promise<Boolean> => {
  let ret = false;
  for (let invitationID of user.invitations) {
    const invite = await Invitation.findById(invitationID);
    if (invite!.calendarID.toString() === calendar._id.toString()) {
      ret = true;
      break;
    }
  }
  return ret;
};

//EndPoints
export const newCalendar = async (req: Request, res: Response) => {
  try {
    const userID = req.userLoged;
    const { title, description } = req.body;

    calendar_validation.validate({ title });

    const data = {
      title,
      description,
      founder: userID,
      members: [userID],
      admins: [userID],
    };

    const newCalendar = new Calendar(data);
    await newCalendar.save();

    const user = await User.findById(userID);
    user!.calendars.push(newCalendar._id);
    await user!.save();

    res.json({ Message: "New calendar created", Calendar: newCalendar });
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const getACalendar = async (req: Request, res: Response) => {
  try {
    const calendar = req.calendar;
    const userID = req.userLoged;

    if (!isFounderOrAdmin(userID, calendar)) {
      return res.status(400).json({ Message: "You can not get this Calendar" });
    }

    res.json(calendar);
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const editCalendar = async (req: Request, res: Response) => {
  try {
    const userID = req.userLoged;
    const calendar = req.calendar;
    const { title, description } = req.body;

    calendar_validation.validate({ title, description });

    if (!isFounder(userID, calendar)) {
      return res
        .status(400)
        .json({ Message: "Just the founder can change the Calendar's name" });
    }

    calendar.title = title;
    calendar.description = description;

    await calendar.save();

    res.json({ Message: "Data succesfuly changed", Calendar: calendar });
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const addMembers = async (req: Request, res: Response) => {
  try {
    const userID = req.userLoged;
    const calendar = req.calendar;
    const { members, message } = req.body;

    calendar_add_validation.validate({ list: members });

    if (!isFounderOrAdmin(userID, calendar)) {
      return res
        .status(400)
        .json({ Error: "You need to be admin to send invitations" });
    }

    for (const memberId of members) {
      const user = await User.findById(memberId);

      if (!user) {
        return res.status(400).json({ Error: "User not found" });
      }

      const isAlreadyPart = user.calendars.includes(calendar._id);
      const wasInvited = await wasAlreadyInvited(user, calendar);
      if (isAlreadyPart || wasInvited) {
        continue;
      }

      const invitation = new Invitation({
        calendarName: calendar.title,
        to: memberId,
        from: userID,
        message,
        calendarID: calendar._id,
      });

      await invitation.save();

      user.invitations.push(invitation._id);
      await user.save();
    }
    res.json({ Message: "All invitations were sended succesfuly" });
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const deleteCalendar = async (req: Request, res: Response) => {
  try {
    const calendar = req.calendar;
    const userID = req.userLoged;

    if (!isFounder(userID, calendar)) {
      return res
        .status(400)
        .json({ Message: "Just the founder can detele a Calendar" });
    }

    //Deleting from Users's calendar list
    for (let user of calendar.members) {
      const userFound = await User.findById(user);
      userFound!.calendars = userFound!.calendars.filter(
        (calenID) => calenID != calendar._id.toString()
      );
      await userFound!.save();
    }
    for (let user of calendar.admins) {
      const userFound = await User.findById(user);
      userFound!.calendars = userFound!.calendars.filter(
        (calenID) => calenID != calendar._id.toString()
      );
      await userFound!.save();
    }

    //Deleting all invitations from this calendar
    //to user invitation list
    const allInvitations = await Invitation.find({ calendarID: calendar._id });
    for (let invite of allInvitations) {
      const userInvited = await User.findById(invite.to);
      if (userInvited) {
        userInvited.invitations = userInvited.invitations.filter(
          (invites) => invites.toString() != invite._id
        );
        await userInvited.save();
      }
    }

    //Deleting all invitations comming from this calendar
    await Invitation.deleteMany({ calendarID: calendar._id });

    await Calendar.findByIdAndDelete(calendar._id);

    res.json({ Message: "Calendar succesfuly deleted" });
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};
