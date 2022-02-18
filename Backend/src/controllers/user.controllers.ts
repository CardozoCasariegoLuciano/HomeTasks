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

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const userDeleted = await User.findByIdAndDelete(user._id);

    res.json({
      Message: "User successfully deleted",
      User_deleted: userDeleted!.email,
    });
  } catch (err) {
    return res.status(400).json("Something went wrong");
  }
};

export const changeName = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const userLoged = req.userLoged;

    if (user._id.toString() === userLoged) {
      const { name } = req.body;
      await changeName_validation.validateAsync({ name });
      user.name = name;
      await user.save();

      return res.json({ Message: "Name successfully changed" });
    }

    return res.status(400).json({Error: "You just can change your name"})

  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};
