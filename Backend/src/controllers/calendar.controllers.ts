import { Request, Response } from "express";
import Calendar, { ICalendar } from "../models/calendar.model";
import User, { IUser } from "../models/user.model";
import Invitation from "../models/invitation.model";
import Task from "../models/task.model";
import {
  calendar_membersList_validation,
  calendar_tasks,
  calendar_validation,
} from "./validations/calendar.validation";

//Functions
const isFounder = (userId: string, calendar: any) => {
  return userId === calendar.founder._id.toString();
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

const isAlreadyPart =(user: IUser, calendar: ICalendar): Boolean => {
      return user.calendars.includes(calendar._id);
}

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

    if (!isFounder(userID, calendar)) {
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

    calendar_membersList_validation.validate({ list: members });

    if (!isFounder(userID, calendar)) {
      return res
        .status(400)
        .json({ Error: "You need to be admin to send invitations" });
    }

    for (const memberId of members) {
      const user = await User.findById(memberId);

      if (!user) {
        return res.status(400).json({ Error: "User not found" });
      }

      const wasInvited = await wasAlreadyInvited(user, calendar);
      if (isAlreadyPart(user, calendar) || wasInvited) {
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

export const deleteMember = async (req: Request ,res:Response) => {
  try{
    const {members} = req.body
    const userID = req.userLoged
    const calendar = req.calendar

    calendar_membersList_validation.validate({ list: members });

    const isHimSelf = members[0] === userID
    if (!isHimSelf && !isFounder(userID, calendar)) {
      return res.status(400).json({Error: "Just the founder can remove a user"})
    }

    const founder = calendar.founder._id.toString()
    if (members.includes(founder)) {
      return res.status(400).json({Error: "The founder cant be removed"})
    }

    for (let memberID of members) {
      calendar.members = calendar.members.filter((memID) => memID != memberID)

      const user = await User.findById(memberID)
      if (!user || !isAlreadyPart(user, calendar)) {
        continue
      }

      user.calendars = user.calendars.filter(cal => cal._id.toString() !== calendar._id.toString())
      await user.save()
    }

    await calendar.save()

   return res.status(200).json("Members removed")
  }catch(err){
    return res.status(400).json({Message: "Something went wrong", Error: err})
  }
}

export const getInvitations = async (req: Request ,res:Response) => {
  try{
    const userID = req.userLoged
    const calendar = req.calendar

    if (!isFounder(userID, calendar)) {
      return res.status(400).json({Error: "Just the founder can ask for that data"})
    }

    const allInvitations = await Invitation.find({calendarID: calendar._id})

    res.status(200).json({Invitations: allInvitations})
  }catch(err){
    return res.status(400).json({Message: "Something went wrong", Error: err})
  }
}

export const createTask = async (req: Request ,res:Response) => {
  try{
    const userID = req.userLoged
    const calendar = req.calendar
    const {title, description, options} = req.body

    if (!isFounder(userID, calendar)) {
      return res.status(400).json({Error: "Just the founder can create a new task"})
    }

    const JoiRes = calendar_tasks.validate({title, description, options})
    if (JoiRes.error) {
      return res.status(400).json({Error: JoiRes.error})
    }

    const newTask = new Task({
      title,
      description,
      options
    })

    calendar.tasks.push(newTask._id)

    await calendar.save()
    await newTask.save()

    res.status(200).json({Message: "New task added", Task: newTask})

  }catch(error){
    return res.status(400).json({Message: "Something went wrong", Error: error})
  }
}

export const getAllTasks = async (req: Request ,res:Response) => {
  try{
    const userID = req.userLoged
    const calendar = req.calendar

    if (!isFounder(userID, calendar)) {
      return res.status(400).json({Error: "Just the founder can ask for that data"})
    }

    const calendarPolulated = await calendar.populate("tasks", "title description options")

    res.status(200).json({Tasks: calendarPolulated.tasks})
  }catch(err){
    return res.status(400).json({Message: "Something went wrong", Error: err})
  }
}

export const getATask = async (req: Request ,res:Response) => {
  try{
    const userID = req.userLoged
    const task = req.task
    const calendar = req.calendar

    if (!isFounder(userID, calendar)) {
      return res.status(400).json({Error: "Just the founder can ask for that data"})
    }

    const taskFinal = await Task.findById(task._id).select("-done")

    res.status(200).json(taskFinal)
  }catch(err){
    return res.status(400).json({Message: "Something went wrong", Error: err})
  }
}

export const deleteTask = async (req: Request ,res:Response) => {
  try{
    res.status(200).json("DeleteTask")
  }catch(err){
    return res.status(400).json({Message: "Something went wrong", Error: err})
  }
}

