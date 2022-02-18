import { Request, Response } from "express";
import {
  login_validation,
  register_validation,
} from "./validations/user.validations";
import User from "../models/user.model";
import jwt from "jsonwebtoken";
import { config } from "../config";


export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    await login_validation.validateAsync({ email, password });

    const existUser = await User.findOne({ email });

    const isValidLogIn = existUser && await existUser.comparePasswords(password);

    if (!isValidLogIn) {
      return res.status(400).json({ Messaje: "Wrong email or password" });
    }

    const token = jwt.sign({ _id: existUser._id }, config.TOKEN_KEY);
    return res.json({ token });
  } catch (err) {
    return res
      .status(400)
      .json({ Messaje: "Something went wrong", Error: err });
  }
};


export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, repited_password, name } = req.body;

    const value = await register_validation.validateAsync({
      email,
      password,
      repited_password,
      name,
    });

    const newUser = new User({
      name: value.name,
      email: value.email,
      password: await User.encriptPassword(value.password),
    });

    const token = jwt.sign({ _id: newUser._id }, config.TOKEN_KEY);

    await newUser.save();

    res.json({
      token,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({
          Messaje: "That email was already taken",
          Type: "MAIL_TAKEN",
          Error: err,
        });
    }

    return res
      .status(400)
      .json({ Messaje: "Something went wrong", Error: err });
  }
};
