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
import Todo from "../../src/models/tasktoDo.model";
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
  await Todo.deleteMany({});
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

  //Inviting user
  await api
    .post(`${URI}/${calendarID}/addmember`)
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
  describe("POST /:id/activity", () => {
    describe("When have token and valid data is sended", () => {
      test("Should return 200", async () => {
        const { calendarID, activity, tokenFounder } = await setUp();
        const resp = await api
          .post(`${URI}/${calendarID}/activity`)
          .send(activity)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(200);
      });

      test("Should create a new activity into DB", async () => {
        const { calendarID, activity, tokenFounder } = await setUp();

        const before = await Activity.find();
        expect(before).toHaveLength(0);

        await api
          .post(`${URI}/${calendarID}/activity`)
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
            .post(`${URI}/${calendarID}/activity`)
            .send(activity)
            .set("Authorization", tokenFounder);
          expect(resp.statusCode).toBe(400);
        }
      });
    });

    describe("When try to add activity an no member user", () => {
      test("Shoudl return 400", async () => {
        const { calendarID, tokenFounder } = await setUp();

        const userTk = await registerUser(userToRegister[2]);
        const userID = await getIdByToken(userTk);

        const activity = {
          user: userID,
          activities: {
            mondays: [],
            thusdays: [],
            wednesdays: [],
            thursdays: [],
            fridays: [],
            saturdays: [],
            sundays: [],
          },
        };

        const resp = await api
          .post(`${URI}/${calendarID}/activity`)
          .send(activity)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(400);
      });
    });
  });

  describe("GET /:id/activity", () => {
    describe("When have token and valid ID", () => {
      test("Should return 200", async () => {
        const { calendarID, tokenFounder } = await setUp();

        const resp = await api
          .get(`${URI}/${calendarID}/activity`)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(200);
      });

      test("Should return an array", async () => {
        const { calendarID, tokenFounder } = await setUp();

        const resp = await api
          .get(`${URI}/${calendarID}/activity`)
          .set("Authorization", tokenFounder);
        expect(resp.body).toBeInstanceOf(Array);
      });

      test("The array length must increase when add a new activity", async () => {
        const { calendarID, tokenFounder, activity } = await setUp();

        const resp = await api
          .get(`${URI}/${calendarID}/activity`)
          .set("Authorization", tokenFounder);
        expect(resp.body).toHaveLength(0);

        await api
          .post(`${URI}/${calendarID}/activity`)
          .send(activity)
          .set("Authorization", tokenFounder);

        const resp1 = await api
          .get(`${URI}/${calendarID}/activity`)
          .set("Authorization", tokenFounder);
        expect(resp1.body).toHaveLength(1);
      });
    });

    describe("When a no member try to get", () => {
      test("Should return 400", async () => {
        const { calendarID } = await setUp();
        const userToken = await registerUser(userToRegister[2]);

        const resp = await api
          .get(`${URI}/${calendarID}/activity`)
          .set("Authorization", userToken);
        expect(resp.statusCode).toBe(400);
      });
    });
  });

  describe("GET /:id/activity/:id", () => {
    describe("When all data is ok", () => {
      test("Should retrun 200", async () => {
        const { calendarID, activity, tokenFounder } = await setUp();
        //Create activity
        const createdActivity = await api
          .post(`${URI}/${calendarID}/activity`)
          .send(activity)
          .set("Authorization", tokenFounder);
        const activityID = createdActivity.body.Activity._id;

        //Get that activity
        const resp = await api
          .get(`${URI}/${calendarID}/activity/${activityID}`)
          .set("Authorization", tokenFounder);

        expect(resp.statusCode).toBe(200);
      });

      test("Should retrun a single object", async () => {
        const { calendarID, activity, tokenFounder } = await setUp();
        //Create activity
        const createdActivity = await api
          .post(`${URI}/${calendarID}/activity`)
          .send(activity)
          .set("Authorization", tokenFounder);
        const activityID = createdActivity.body.Activity._id;

        //Get that activity
        const resp = await api
          .get(`${URI}/${calendarID}/activity/${activityID}`)
          .set("Authorization", tokenFounder);

        expect(resp.body).toBeInstanceOf(Object);
      });

      test("Should retrun the activity", async () => {
        const { calendarID, activity, tokenFounder } = await setUp();
        //Create activity
        const createdActivity = await api
          .post(`${URI}/${calendarID}/activity`)
          .send(activity)
          .set("Authorization", tokenFounder);
        const activityID = createdActivity.body.Activity._id;

        //Get that activity
        const resp = await api
          .get(`${URI}/${calendarID}/activity/${activityID}`)
          .set("Authorization", tokenFounder);

        expect(resp.body._id).toBeDefined();
        expect(resp.body.calendar_id).toBeDefined();
        expect(resp.body.user).toBeDefined();
      });
    });

    describe("When a no member try to get", () => {
      test("Should return 400", async () => {
        const { calendarID, activity, tokenFounder } = await setUp();
        const userToken = await registerUser(userToRegister[2]);

        //Create activity
        const createdActivity = await api
          .post(`${URI}/${calendarID}/activity`)
          .send(activity)
          .set("Authorization", tokenFounder);
        const activityID = createdActivity.body.Activity._id;

        const resp = await api
          .get(`${URI}/${calendarID}/activity/${activityID}`)
          .set("Authorization", userToken);

        expect(resp.statusCode).toBe(400);
      });
    });
  });

  describe("DELETE /:id/activity/:id", () => {
    describe("When all data is ok", () => {
      test("Should retrun 200", async () => {
        const { calendarID, activity, tokenFounder } = await setUp();
        //Create activity
        const createdActivity = await api
          .post(`${URI}/${calendarID}/activity`)
          .send(activity)
          .set("Authorization", tokenFounder);
        const activityID = createdActivity.body.Activity._id;

        //Delete that activity
        const resp = await api
          .delete(`${URI}/${calendarID}/activity/${activityID}`)
          .set("Authorization", tokenFounder);

        expect(resp.statusCode).toBe(200);
      });

      test("Should remove that actyvity from DB", async () => {
        const { calendarID, activity, tokenFounder } = await setUp();
        //Create activity
        const createdActivity = await api
          .post(`${URI}/${calendarID}/activity`)
          .send(activity)
          .set("Authorization", tokenFounder);
        const activityID = createdActivity.body.Activity._id;

        //Assertion
        const after = await Activity.findById(activityID);
        expect(after).not.toBeNull();

        //Delete that activity
        await api
          .delete(`${URI}/${calendarID}/activity/${activityID}`)
          .set("Authorization", tokenFounder);

        //Assertion
        const before = await Activity.findById(activityID);
        expect(before).toBeNull();
      });
    });

    describe("When a regular user try to delete a todo", () => {
      test("Should return 400", async () => {
        const { calendarID, activity, tokenFounder } = await setUp();
        const userToken = await registerUser(userToRegister[2]);

        //Create activity
        const createdActivity = await api
          .post(`${URI}/${calendarID}/activity`)
          .send(activity)
          .set("Authorization", tokenFounder);
        const activityID = createdActivity.body.Activity._id;

        //Delete that activity
        const resp = await api
          .delete(`${URI}/${calendarID}/activity/${activityID}`)
          .set("Authorization", userToken);
        expect(resp.statusCode).toBe(400);
      });
    });
  });

  describe("PUT /:id/activity", () => {
    describe("When have token and valid data is sended", () => {
      test("Should return 200", async () => {
        const { taskID, calendarID, activity, tokenFounder } = await setUp();

        //Create activity
        const createdActivity = await api
          .post(`${URI}/${calendarID}/activity`)
          .send(activity)
          .set("Authorization", tokenFounder);
        const activityID = createdActivity.body.Activity._id;

        //Edit Actrivity
        const activityEDIT = {
          activities: {
            mondays: [],
            thusdays: [taskID, taskID],
            wednesdays: [],
            thursdays: [],
            fridays: [],
            saturdays: [],
            sundays: [],
          },
        };

        const resp = await api
          .put(`${URI}/${calendarID}/activity/${activityID}`)
          .send(activityEDIT)
          .set("Authorization", tokenFounder);

        expect(resp.statusCode).toBe(200);
      });

      test("Should edit de Activity values", async () => {
        const { taskID, calendarID, activity, tokenFounder } = await setUp();

        //Create activity
        const createdActivity = await api
          .post(`${URI}/${calendarID}/activity`)
          .send(activity)
          .set("Authorization", tokenFounder);
        const activityID = createdActivity.body.Activity._id;

        expect(createdActivity.body.Activity.mondays).toHaveLength(2);
        expect(createdActivity.body.Activity.thusdays).toHaveLength(0);
        expect(createdActivity.body.Activity.fridays).toHaveLength(1);

        //Edit Actrivity
        const activityEDIT = {
          activities: {
            mondays: [],
            thusdays: [taskID, taskID],
            wednesdays: [],
            thursdays: [],
            fridays: [],
            saturdays: [],
            sundays: [],
          },
        };

        const resp = await api
          .put(`${URI}/${calendarID}/activity/${activityID}`)
          .send(activityEDIT)
          .set("Authorization", tokenFounder);

        expect(resp.body.Activity.mondays).toHaveLength(0);
        expect(resp.body.Activity.thusdays).toHaveLength(2);
        expect(resp.body.Activity.fridays).toHaveLength(0);
      });
    });

    describe("When invalid data is sended", () => {
      test("Shoudl return 400", async () => {
        const { activity, calendarID, taskID, userID, tokenFounder } =
          await setUp();

        //Create activity
        const createdActivity = await api
          .post(`${URI}/${calendarID}/activity`)
          .send(activity)
          .set("Authorization", tokenFounder);
        const activityID = createdActivity.body.Activity._id;

        const badCases = [
          {},
          {
            activities: {
              lunes: [taskID],
              martes: [],
              miercoles: [],
            },
          },
          { activities: {} },
          {
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

        for (let body of badCases) {
          const resp = await api
            .put(`${URI}/${calendarID}/activity/${activityID}`)
            .send(body)
            .set("Authorization", tokenFounder);
          expect(resp.statusCode).toBe(400);
        }
      });
    });
  });
});