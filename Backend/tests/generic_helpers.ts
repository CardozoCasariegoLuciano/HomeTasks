import supertest from "supertest";
import app from "../src/app";
import User from "../src/models/user.model";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../src/interfaces/token_interfaces";
import { config } from "../src/config";

export const api = supertest(app);

//DATA
export const userToRegister = [
  {
    name: "Pepe",
    email: "Pepe@gmail.com",
    password: "123123",
    repited_password: "123123",
  },
  {
    name: "Paula",
    email: "Paula@gmail.com",
    password: "123123",
    repited_password: "123123",
  },
  {
    name: "Ivan",
    email: "Ivan@gmail.com",
    password: "123123",
    repited_password: "123123",
  },
];

export const userToLogin = [
  {
    email: "Pepe@gmail.com",
    password: "123123",
  },
  {
    email: "Paula@gmail.com",
    password: "123123",
  },
  {
    email: "Ivan@gmail.com",
    password: "123123",
  },
];

//Functions
export const registerUser = async (data: any) => {
  const resp = await api.post("/api/auth/register").send(data);
  const token = resp.body.token;
  return token;
};

export const loginUser = async (data: any) => {
  const resp = await api.post("/api/auth/login").send(data);
  const token = resp.body.token;
  return token;
};

export const addUser = async (data: any) => {
  const user = new User(data);
  await user.save();
  return user;
};

export const getIdByToken = async (token: string) => {
  const data = jwt.verify(token, config.TOKEN_KEY) as JwtPayload;
  return data._id;
};
