import { Request, Response } from "express";
import Activity from "../models/activity.model";

export const getAllActivities = async (req: Request ,res:Response) => {
  try{
    const userID = req.userLoged

    const userActivities = await Activity.find({user: userID})
      .populate("mondays")
      .populate("thusdays")
      .populate("wednesdays")
      .populate("thursdays")
      .populate("fridays")
      .populate("saturdays")
      .populate("sundays")

    return res.status(200).json(userActivities)
  }catch(err){
    return res.status(400).json({Message: "Something went wrong", Error: err})
  }
}


export const usercalendarActivities = async (req: Request ,res:Response) => {
  try{
    const userID = req.userLoged
    const calendar = req.calendar

    const userActivities = await Activity.find({user: userID, calendar_id: calendar._id})
      .populate("mondays")
      .populate("thusdays")
      .populate("wednesdays")
      .populate("thursdays")
      .populate("fridays")
      .populate("saturdays")
      .populate("sundays")

    return res.status(200).json(userActivities)
  }catch(err){
    return res.status(400).json({Message: "Something went wrong", Error: err})
  }
}
