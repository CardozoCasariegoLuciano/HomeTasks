import * as express from "express";
import {IUser} from "../../src/models/user.model"
import {ICalendar} from "../../src/models/calendar.model"
import {Iinvitation} from "../../src/models/invitation.model"
import {ITasks} from "../../src/models/task.model";
import {IActivity} from "../../src/models/activity.model";
import {ITasksToDo} from "../../src/models/tasktoDo.model";

declare global {
  namespace Express {
    interface Request {
      user: IUser;
      userLoged: string;
      calendar: ICalendar;
      invitation: Iinvitation;
      task: ITasks;
      activity: IActivity;
      todo: ITasksToDo
    }
  }
}
