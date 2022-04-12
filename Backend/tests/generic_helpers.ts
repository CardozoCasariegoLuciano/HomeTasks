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


//setUp
export const setUp = async () => {

  const body = { title: "Title1"}
  const URIcalendar = "/api/calendar"
  const tokenFounder = await registerUser(userToRegister[0]);
  const tokenUser = await registerUser(userToRegister[1]);
  const userID = await getIdByToken(tokenUser);

  //Create calendar
  const createdCalendar = await api
    .post(URIcalendar)
    .send(body)
    .set("Authorization", tokenFounder);
  const calendarID = createdCalendar.body.Calendar._id;

  //Adding a task
  const data = {
    title: "Baños",
    description: "Limpiar el baño y lavar la ropa",
  };
  const createdTask = await api
    .post(`${URIcalendar}/${calendarID}/addtask`)
    .send(data)
    .set("Authorization", tokenFounder);
  const taskID = createdTask.body.Task._id;

  //Inviting user
  await api
    .post(`${URIcalendar}/${calendarID}/addmember`)
    .send({ members: [userID] })
    .set("Authorization", tokenFounder);
  //Accept invitation
  const userLoged = await User.findById(userID);
  const inviID = userLoged!.invitations[0];

  //accepting invitation
  await api
    .post(`/api/invitations/${inviID}/accept`)
    .set("Authorization", tokenUser);

  //Adding a user activity
  const activity = {
    user: userID,
    activities: {
      mondays: [taskID, taskID],
      thusdays: [],
      wednesdays: [taskID],
      thursdays: [],
      fridays: [taskID],
      saturdays: [taskID],
      sundays: [],
    },
  };
  const createdActivity = await api
    .post(`${URIcalendar}/${calendarID}/activity`)
    .send(activity)
    .set("Authorization", tokenFounder);

  return {
    userID,
    tokenUser,
    tokenFounder,
    calendarID,
    activity,
    taskID,
    createdActivity : createdActivity.body.Activity,
  };
};
