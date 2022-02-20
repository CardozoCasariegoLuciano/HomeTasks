import User from "../../models/user.model";
import {api} from "../generic_helpers"

export const user01 = {
  name: "Pepe",
  email: "Pepe@gmail.com",
  password: "123123",
  repited_password: "123123",
};

export const user02 = {
  name: "Pablo",
  email: "Pablo@gmail.com",
  password: "123123",
  repited_password: "123123",
};

export const registerUser = async (data: any) => {
  const resp = await api.post("/api/auth/register").send(data)
  const token = resp.body.token
  return token;
};

export const addUser = async (data: any) => {
  const user = new User(data)
  await user.save()
  return user;
};

export const URI = "/api/user";
