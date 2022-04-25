import { Request, Response } from "express";
import Activity from "../models/activity.model";

export const getAllActivities = async (req: Request ,res:Response) => {
  try{
    const userID = req.userLoged

    const userActivities = await Activity.find({user: userID})
      .populate({
        path:"activities",
        populate: "mondays thusdays wednesdays thursdays fridays sundays saturdays",
      })

    return res.status(200).json(userActivities)
  }catch(err){
    return res.status(400).json({Message: "Something went wrong", Error: err})
  }
}

export const getATodo = async (req: Request ,res:Response) => {
  try{
    const user = req.userLoged
    const activity = req.activity
    const todo = req.todo

    if (user.toString() != activity.user.toString()) {
      return res.status(400).json({Error: "You cant ask for this todo"})
    }

    await todo.populate("taskID")

    res.status(200).json(todo)
  }catch(err){
    return res.status(400).json({Message: "Something went wrong", Error: err})
  }
}

export const toggleDONE = async (req: Request ,res:Response) => {
  try{
    const user = req.userLoged
    const activity = req.activity
    const todo = req.todo

    if (user.toString() != activity.user.toString()) {
      return res.status(400).json({Error: "You cant ask for this todo"})
    }

    todo.done = !todo.done
    await todo.save()

    res.status(200).json({Message: `Task done: ${todo.done}`})
  }catch(err){
    return res.status(400).json({Message: "Something went wrong", Error: err})
  }
}
