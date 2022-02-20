import { Request, Response } from "express";
import Calendar, { ICalendar } from "../models/calendar.model";
import User from "../models/user.model";
import Invitation from "../models/invitation.model";
import { calendar_validation } from "./validations/calendar.validation";

const isFounder = (userId: string, calendar: any) => {
  return userId === calendar.founder._id.toString();
};

export const getCalendars = async (req: Request, res: Response) => {
  try {
    const allCalendars = await Calendar.find().populate(
      "founder",
      "name email _id"
    );
    return res.json(allCalendars);
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const getACalendar = async (req: Request, res: Response) => {
  try {
    const calendar = req.calendar;
    res.json(calendar);
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const newCalendar = async (req: Request, res: Response) => {
  try {
    const userID = req.userLoged;
    const { title } = req.body;

    calendar_validation.validate({ title });

    const data = {
      title,
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

export const deleteCalendar = async (req: Request, res: Response) => {
  try {
    const calendar = req.calendar;
    const userID = req.userLoged;

    if (!isFounder(userID, calendar)) {
      return res
        .status(400)
        .json({ Message: "Just the founder can detele a Calendar" });
    }

    await Calendar.findByIdAndDelete(calendar._id);

    const user = await User.findById(userID);
    user!.calendars = user!.calendars.filter(
      (calenID) => calenID != calendar._id.toString()
    );
    await user!.save();

    res.json({ Message: "Calendar succesfuly deleted" });
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const renameCalendar = async (req: Request, res: Response) => {
  try {
    const userID = req.userLoged;
    const calendar = req.calendar;
    const { title } = req.body;

    calendar_validation.validate({ title });

    if (!isFounder(userID, calendar)) {
      return res
        .status(400)
        .json({ Message: "Just the founder can change the Calendar's name" });
    }

    calendar.title = title;
    await calendar.save();

    res.json({ Message: "Title succesfuly changed", Calendar: calendar });
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

    calendar_validation.validate({ members });

    const isAdmin = calendar.admins.includes(userID)
    if (!isAdmin) {
        return res.status(400).json({ Error: "You need to be admin to send invitations" });
    }

    for (const memberId of members) {
      const user = await User.findById(memberId);

      if (!user) {
        return res.status(400).json({ Error: "User not found" });
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
