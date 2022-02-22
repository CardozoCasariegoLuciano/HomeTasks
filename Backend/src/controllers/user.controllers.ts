import { Request, Response } from "express";
import User from "../models/user.model";
import { changeName_validation } from "./validations/user.validations";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const allUsers = await User.find().select({ password: 0 });
    res.json(allUsers);
  } catch (err) {
    return res.status(400).json("Something went wrong");
  }
};

export const getAUser = async (req: Request, res: Response) => {
  const user = req.user;
  res.json(user);
};

export const changeName = async (req: Request, res: Response) => {
  try {
    const userLoged = req.userLoged;
    const { name } = req.body;

    const user = await User.findById(userLoged)
    await changeName_validation.validateAsync({ name });
    user!.name = name;
    await user!.save();

    return res.json({ Message: "Name successfully changed" });
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};
