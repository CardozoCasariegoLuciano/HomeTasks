import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import {JwtPayload} from "../interfaces/token_interfaces";

export const hasToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")

    if (token) {
      const data = jwt.verify(token, config.TOKEN_KEY) as JwtPayload;

      req.userLoged = data._id;
      next();
    } else {
      res.statusCode = 400
      res.json({Error: "No token provider"});
    }
  } catch (err) {
    //return res.status(400).json({ Message: "Something went wrong", Error: err });
    res.statusCode = 400
    res.json({ Message: "Something went wrong", Error: err });
  }
};

