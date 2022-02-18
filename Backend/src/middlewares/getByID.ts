import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import { objectID_validation } from "./validation/objectID.validation";

export const getUserByID = async (
  req: Request,
  res: Response,
  next: NextFunction,
  id: string
) => {
  try {
    await objectID_validation.validateAsync({ id });
    const user = await User.findById(id).select({ password: 0 });

    if (!user) {
      return res.status(400).json({ Error: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};
