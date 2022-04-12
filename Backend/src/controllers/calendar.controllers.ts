import { Request, Response } from "express";
import Calendar, { ICalendar } from "../models/calendar.model";
import User, { IUser } from "../models/user.model";
import Activity, { IActivity } from "../models/activity.model";
import Invitation from "../models/invitation.model";
import Todo from "../models/tasktoDo.model";
import Task from "../models/task.model";
import {
  calendar_membersList_validation,
  calendar_option_tasks,
  calendar_tasks,
  calendar_ToDo,
  calendar_ToDo_edit,
  calendar_validation,
} from "./validations/calendar.validation";
import { IDasObject, isValidID } from "../helpers/functions";

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

const isAlreadyPart = (userID: string, calendar: ICalendar): Boolean => {
  const ret = calendar.members.includes(IDasObject(userID));
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
      if (isAlreadyPart(user._id, calendar) || wasInvited) {
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

export const deleteMember = async (req: Request, res: Response) => {
  try {
    const { members } = req.body;
    const userID = req.userLoged;
    const calendar = req.calendar;

    calendar_membersList_validation.validate({ list: members });

    const isHimSelf = members[0] === userID;
    if (!isHimSelf && !isFounder(userID, calendar)) {
      return res
        .status(400)
        .json({ Error: "Just the founder can remove a user" });
    }

    const founder = calendar.founder._id.toString();
    if (members.includes(founder)) {
      return res.status(400).json({ Error: "The founder cant be removed" });
    }

    for (let memberID of members) {
      const user = await User.findById(memberID);
      if (!user || !isAlreadyPart(user._id.toString(), calendar)) {
        continue;
      }

      user.calendars = user.calendars.filter(
        (cal) => cal._id.toString() !== calendar._id.toString()
      );

      await user.save();
      calendar.members = calendar.members.filter((memID) => memID != memberID);
    }

    await calendar.save();

    return res.status(200).json("Members removed");
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const getInvitations = async (req: Request, res: Response) => {
  try {
    const userID = req.userLoged;
    const calendar = req.calendar;

    if (!isFounder(userID, calendar)) {
      return res
        .status(400)
        .json({ Error: "Just the founder can ask for that data" });
    }

    const allInvitations = await Invitation.find({ calendarID: calendar._id });

    res.status(200).json({ Invitations: allInvitations });
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const userID = req.userLoged;
    const calendar = req.calendar;
    const { title, description, options } = req.body;

    if (!isFounder(userID, calendar)) {
      return res
        .status(400)
        .json({ Error: "Just the founder can create a new task" });
    }

    const JoiRes = calendar_tasks.validate({ title, description, options });
    if (JoiRes.error) {
      return res.status(400).json({ Error: JoiRes.error });
    }

    const newTask = new Task({
      title,
      description,
      options,
    });

    calendar.tasks.push(newTask._id);

    await calendar.save();
    await newTask.save();

    res.status(200).json({ Message: "New task added", Task: newTask });
  } catch (error) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: error });
  }
};

export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const userID = req.userLoged;
    const calendar = req.calendar;

    if (!isFounder(userID, calendar)) {
      return res
        .status(400)
        .json({ Error: "Just the founder can ask for that data" });
    }

    const calendarPolulated = await calendar.populate("tasks");

    res.status(200).json({ Tasks: calendarPolulated.tasks });
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const getATask = async (req: Request, res: Response) => {
  try {
    const userID = req.userLoged;
    const task = req.task;
    const calendar = req.calendar;

    if (!isFounder(userID, calendar)) {
      return res
        .status(400)
        .json({ Error: "Just the founder can ask for that data" });
    }

    res.status(200).json(task);
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const userID = req.userLoged;
    const calendar = req.calendar;
    const task = req.task;

    if (!isFounder(userID, calendar)) {
      return res
        .status(400)
        .json({ Error: "Just the founder can delete a task" });
    }

    calendar.tasks = calendar.tasks.filter(
      (t) => t._id.toString() != task._id.toString()
    );
    await calendar.save();
    await Task.findByIdAndDelete(task._id);

    res.status(200).json("DeleteTask");
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const addTaskOption = async (req: Request, res: Response) => {
  try {
    const userID = req.userLoged;
    const calendar = req.calendar;
    const { options } = req.body;
    const task = req.task;

    if (!isFounder(userID, calendar)) {
      return res
        .status(400)
        .json({ Error: "Just the founder can add an option" });
    }

    const joiVal = calendar_option_tasks.validate({ options });
    if (joiVal.error) {
      return res.status(400).json({ Error: joiVal.error });
    }

    task.options = task.options.concat(options);
    await task.save();

    res.status(200).json({ Message: "Options added" });
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const editTaksOptions = async (req: Request, res: Response) => {
  try {
    const userID = req.userLoged;
    const calendar = req.calendar;
    const { options } = req.body;
    const task = req.task;

    if (!isFounder(userID, calendar)) {
      return res
        .status(400)
        .json({ Error: "Just the founder can add an option" });
    }

    const joiVal = calendar_option_tasks.validate({ options });
    if (joiVal.error) {
      return res.status(400).json({ Error: joiVal.error });
    }

    task.options = options;
    await task.save();

    res.status(200).json({ Message: "Options edited" });
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const addToDo = async (req: Request, res: Response) => {
  try {
    const userID = req.userLoged;
    const { user, activities } = req.body;
    const calendar = req.calendar;

    if (!isFounder(userID, calendar)) {
      return res
        .status(400)
        .json({ Error: "Just the founder can create a todo" });
    }
    if (!isAlreadyPart(user, calendar)) {
      return res
        .status(400)
        .json({ Error: "The user must be part of the calendar" });
    }

    const joiVal = calendar_ToDo.validate({ user, activities });
    if (joiVal.error) {
      return res.status(400).json({ Error: joiVal.error });
    }

    const activityData: any = {
      user,
      calendar_id: calendar._id.toString(),
      mondays: [],
      thusdays: [],
      wednesdays: [],
      thursdays: [],
      fridays: [],
      saturdays: [],
      sundays: [],
    };

    for (let todoDay in activities) {
      for (let taskID of activities[todoDay]) {
        if (!isValidID(taskID)) {
          return res.status(400).json({ Error: "no valid ID" });
        }
        if (!calendar.tasks.includes(IDasObject(taskID))) {
          return res.status(400).json({ Error: "no valid task" });
        } else {
          const newTodo = new Todo({ taskID });
          await newTodo.save();
          activityData[todoDay].push(newTodo._id);
        }
      }
    }

    const newActivity = new Activity(activityData);
    await newActivity.save();

    res.status(200).json({ Message: "Activity added", Activity: newActivity });
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const getToDos = async (req: Request, res: Response) => {
  try {
    const calendar = req.calendar;
    const userID = req.userLoged;

    if (!isAlreadyPart(userID, calendar)) {
      return res
        .status(400)
        .json({ Error: "Must be part of the calendar to get this data" });
    }

    const activities = await Activity.find({ calendar_id: calendar._id });

    res.status(200).json(activities);
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const getAToDo = async (req: Request, res: Response) => {
  try {
    const calendar = req.calendar;
    const userID = req.userLoged;
    const activity = req.activity;

    if (!isAlreadyPart(userID, calendar)) {
      return res
        .status(400)
        .json({ Error: "Must be part of the calendar to get this data" });
    }

    res.status(200).json(activity);
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const deleteToDo = async (req: Request ,res:Response) => {
  try{
    const calendar = req.calendar;
    const userID = req.userLoged;
    const activity = req.activity;

    if (!isFounder(userID, calendar)) {
      return res
        .status(400)
        .json({ Error: "Just the founder can delete a user  activity" });
    }

    const deleted = await Activity.findByIdAndRemove(activity._id)

    res.status(200).json({Activity_Deleted: deleted})

  }catch(err){
    return res.status(400).json({Message: "Something went wrong", Error: err})
  }
}

export const updateToDo = async (req: Request ,res:Response) => {
  try{
    const userID = req.userLoged;
    const {activities} = req.body;
    const calendar = req.calendar;
    const activity = req.activity

    if (!isFounder(userID, calendar)){
      return res
        .status(400)
        .json({ Error: "Just the founder can create a todo" });
    }

    const joiVal = calendar_ToDo_edit.validate({activities});
    if (joiVal.error) {
      return res.status(400).json({ Error: joiVal.error });
    }

    const activityData: any = {
      user: activity.user,
      calendar_id: activity.calendar_id,
      mondays: [],
      thusdays: [],
      wednesdays: [],
      thursdays: [],
      fridays: [],
      saturdays: [],
      sundays: [],
    };

    for (let todoDay in activities) {
      for (let taskID of activities[todoDay]) {
        if (!isValidID(taskID)) {
          return res.status(400).json({ Error: "no valid ID" });
        }
        if (!calendar.tasks.includes(IDasObject(taskID))) {
          return res.status(400).json({ Error: "no valid task" });
        } else {
          const newTodo = new Todo({ taskID });
          await newTodo.save();
          activityData[todoDay].push(newTodo._id);
        }
      }
    }

    const newActivity = await Activity.findByIdAndUpdate(activity._id, activityData, {new: true})

    res.status(200).json({ Message: "Activity edited", Activity: newActivity });
  }catch(err){
    return res.status(400).json({Message: "Something went wrong", Error: err})
  }
}

export const getFullTable = async (req: Request ,res:Response) => {
  try{
    const calendar = req.calendar
    const user = req.userLoged

    if (!isAlreadyPart(user, calendar)) {
      return res.status(400).json({Message: "You need to be part of the calendar"})
    }

    const allAct = await Activity.find({calendar_id: calendar._id})
      .populate("user", "name email")
      .populate({path: "mondays", populate: {path:"taskID"}})
      .populate({path: "thusdays", populate: {path:"taskID"}})
      .populate({path: "wednesdays", populate: {path:"taskID"}})
      .populate({path: "thursdays", populate: {path:"taskID"}})
      .populate({path: "fridays", populate: {path:"taskID"}})
      .populate({path: "saturdays", populate: {path:"taskID"}})
      .populate({path: "sundays", populate: {path:"taskID"}})

    res.status(200).json(allAct)
  }catch(err){
    return res.status(400).json({Message: "Something went wrong", Error: err})
  }
}
