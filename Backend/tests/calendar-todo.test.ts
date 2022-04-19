import {
  api,
  getIdByToken,
  registerUser,
  userToRegister,
  setUp,
} from "./generic_helpers";
import mongoose from "mongoose";
import Calendar from "../src/models/calendar.model";
import Invitation from "../src/models/invitation.model";
import Activity from "../src/models/activity.model";
import Todo from "../src/models/tasktoDo.model";
import User from "../src/models/user.model";
import Task from "../src/models/task.model";


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

export const URI = "/api/calendar";

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
        //An activity is added on the setUp

        const before = await Activity.find();
        expect(before).toHaveLength(1);

        //Add other activity
        await api
          .post(`${URI}/${calendarID}/activity`)
          .send(activity)
          .set("Authorization", tokenFounder);

        const after = await Activity.find();
        expect(after).toHaveLength(2);
      });
    });

    describe("When invalid data is sended", () => {
      test("Shoudl return 400", async () => {
        const { calendarID, userID, tokenFounder } = await setUp();

        const badCases = [
          {},
          { user: userID },
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
        const { calendarID, tokenFounder, userNoMemberTk } = await setUp();

        const userID = await getIdByToken(userNoMemberTk);

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
        expect(resp.body).toHaveLength(1);

        await api
          .post(`${URI}/${calendarID}/activity`)
          .send(activity)
          .set("Authorization", tokenFounder);

        const resp1 = await api
          .get(`${URI}/${calendarID}/activity`)
          .set("Authorization", tokenFounder);
        expect(resp1.body).toHaveLength(2);
      });
    });

    describe("When a no member try to get", () => {
      test("Should return 400", async () => {
        const { calendarID, userNoMemberTk } = await setUp();

        const resp = await api
          .get(`${URI}/${calendarID}/activity`)
          .set("Authorization", userNoMemberTk);
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
        const { calendarID, activity, tokenFounder, userNoMemberTk } = await setUp();

        //Create activity
        const createdActivity = await api
          .post(`${URI}/${calendarID}/activity`)
          .send(activity)
          .set("Authorization", tokenFounder);
        const activityID = createdActivity.body.Activity._id;

        const resp = await api
          .get(`${URI}/${calendarID}/activity/${activityID}`)
          .set("Authorization", userNoMemberTk);

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
        const { calendarID, activity, tokenFounder, userNoMemberTk } = await setUp();

        //Create activity
        const createdActivity = await api
          .post(`${URI}/${calendarID}/activity`)
          .send(activity)
          .set("Authorization", tokenFounder);
        const activityID = createdActivity.body.Activity._id;

        //Delete that activity
        const resp = await api
          .delete(`${URI}/${calendarID}/activity/${activityID}`)
          .set("Authorization", userNoMemberTk);
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

        expect(createdActivity.body.Activity.activities.mondays).toHaveLength(2);
        expect(createdActivity.body.Activity.activities.thusdays).toHaveLength(0);
        expect(createdActivity.body.Activity.activities.fridays).toHaveLength(1);

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

        expect(resp.body.Activity.activities.mondays).toHaveLength(0);
        expect(resp.body.Activity.activities.thusdays).toHaveLength(2);
        expect(resp.body.Activity.activities.fridays).toHaveLength(0);
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
