import * as express from "express";
import {IUser} from "../../src/models/user.model"
import {ICalendar} from "../../src/models/calendar.model"
import {Iinvitation} from "../../src/models/invitation.model"
import {ITasks} from "../../src/models/task.model";

declare global {
  namespace Express {
    interface Request {
      user: IUser;
      userLoged: string;
      calendar: ICalendar;
      invitation: Iinvitation;
      task: ITasks
    }
  }
}
