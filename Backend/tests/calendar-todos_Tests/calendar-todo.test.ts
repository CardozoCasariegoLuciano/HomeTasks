import {
  api,
  getIdByToken,
  registerUser,
  userToRegister,
} from "../generic_helpers";
import mongoose from "mongoose";
import Calendar from "../../src/models/calendar.model";
import Invitation from "../../src/models/invitation.model";
import Activity from "../../src/models/activity.model";
import User from "../../src/models/user.model";
import Task from "../../src/models/task.model";
import { cases, URI } from "../calendar_Tests/utils";

afterAll(() => {
  mongoose.disconnect();
});

beforeEach(async () => {
  await Activity.deleteMany({});
  await Calendar.deleteMany({});
  await User.deleteMany({});
  await Invitation.deleteMany({});
  await Task.deleteMany({});
});

const setUp = async () => {
  const body = cases[0];
  const tokenFounder = await registerUser(userToRegister[0]);
  const tokenUser = await registerUser(userToRegister[1]);
  const userID = await getIdByToken(tokenUser);

  //Create calendar
  const createdCalendar = await api
    .post(URI)
    .send(body)
    .set("Authorization", tokenFounder);
  const calendarID = createdCalendar.body.Calendar._id;

  //Adding a task
  const data = {
    title: "Baños",
    description: "Limpiar el baño y lavar la ropa",
  };
  const createdTask = await api
    .post(`${URI}/${calendarID}/addtask`)
    .send(data)
    .set("Authorization", tokenFounder);
  const taskID = createdTask.body.Task._id;

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

  return {
    userID,
    tokenUser,
    tokenFounder,
    calendarID,
    activity,
    taskID,
  };
};

describe("/api/calendar", () => {
  describe("POST /:id/todo", () => {
    describe("When have token and valid data is sended", () => {
      test("Should return 200", async () => {
        const { calendarID, activity, tokenFounder } = await setUp();
        const resp = await api
          .post(`${URI}/${calendarID}/todo`)
          .send(activity)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(200);
      });

      test("Should create a new activity into DB", async () => {
        const { calendarID, activity, tokenFounder } = await setUp();

        const before = await Activity.find();
        expect(before).toHaveLength(0);

        await api
          .post(`${URI}/${calendarID}/todo`)
          .send(activity)
          .set("Authorization", tokenFounder);

        const after = await Activity.find();
        expect(after).toHaveLength(1);
      });
    });

    describe("When invalid data is sended", () => {
     test("Shoudl return 400", async () => {
        const { calendarID, taskID, userID, tokenFounder } = await setUp();

        const badCases = [
          {},
          { user: userID },
          {
            user: userID,
            activities: {
              lunes: [taskID],
              martes: [],
              miercoles: [],
            },
          },
          { user: userID, activities: {} },
          {
            user: userID,
            activities: {
              mondays: ["novalidID"],
              thusdays: ["novalidID"],
              wednesdays: [],
              thursdays: ["novalidID"],
              fridays: ["novalidID"],
              saturdays: [],
              sundays: [],
            },
          },
        ];

        for (let activity of badCases) {
          const resp = await api
            .post(`${URI}/${calendarID}/todo`)
            .send(activity)
            .set("Authorization", tokenFounder);
          expect(resp.statusCode).toBe(400);
        }
      });
    });
  });
});
