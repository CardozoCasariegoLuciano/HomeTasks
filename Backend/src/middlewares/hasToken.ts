import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export const hasToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization");

    if (token) {
      const data = jwt.verify(token, config.TOKEN_KEY) as JwtPayload;

      req.userLoged = data._id;
      next();
    } else {
      return res.status(400).json({ Error: "No token provider" });
    }
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

interface JwtPayload {
  _id: string;
}
