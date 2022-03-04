import {
  api,
  getIdByToken,
  registerUser,
  userToRegister,
} from "../generic_helpers";
import mongoose from "mongoose";
import Calendar from "../../src/models/calendar.model";
import Invitation from "../../src/models/invitation.model";
import User from "../../src/models/user.model";
import { badCases, cases, URI } from "./utils";

afterAll(() => {
  mongoose.disconnect();
});

beforeEach(async () => {
  await Calendar.deleteMany({});
  await User.deleteMany({});
  await Invitation.deleteMany({});
});

describe("/api/calendar", () => {
  describe("GET /:id", () => {
    describe("When has token, valid ID and is part of the calendar", () => {
      const body = cases[0];

      test("Should respond 200", async () => {
        const token = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", token);

        const calendarID = createdCalendar.body.Calendar._id;
        const resp = await api
          .get(`${URI}/${calendarID}`)
          .set("Authorization", token);
        expect(resp.statusCode).toBe(200);
      });

      test("Should respond a calendar", async () => {
        const token = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", token);

        const calendarID = createdCalendar.body.Calendar._id;
        const resp = await api
          .get(`${URI}/${calendarID}`)
          .set("Authorization", token);
        expect(resp.body).toBeInstanceOf(Object);
        expect(resp.body.title).toBeDefined();
        expect(resp.body.founder).toBeDefined();
        expect(resp.body._id).toBeDefined();
      });

      {
        /* TODO: add test using other user (diferent from the founder) mar 22 feb 2022 16:08:36  */
      }
    });

    describe("When has token, valid ID but is not part of the calendar", () => {
      const body = cases[0];

      test("Should respond 400", async () => {
        const tokenA = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenA);
        const calendarID = createdCalendar.body.Calendar._id;

        const tokenB = await registerUser(userToRegister[1]);
        const resp = await api
          .get(`${URI}/${calendarID}`)
          .set("Authorization", tokenB);
        expect(resp.statusCode).toBe(400);
      });

      test("Should respond a Message", async () => {
        const tokenA = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenA);
        const calendarID = createdCalendar.body.Calendar._id;

        const tokenB = await registerUser(userToRegister[1]);
        const resp = await api
          .get(`${URI}/${calendarID}`)
          .set("Authorization", tokenB);
        expect(resp.body.Message).toBe("You can not get this Calendar");
      });
    });

    describe("When no valid ID is sended", () => {
      test("Should respond 400", async () => {
        const tokenA = await registerUser(userToRegister[0]);
        const calendarID = "asdasdadasdas";

        const resp = await api
          .get(`${URI}/${calendarID}`)
          .set("Authorization", tokenA);
        expect(resp.statusCode).toBe(400);
      });

      test("Should respond a Message", async () => {
        const tokenA = await registerUser(userToRegister[0]);
        const calendarID = "asdasdadasdas";

        const resp = await api
          .get(`${URI}/${calendarID}`)
          .set("Authorization", tokenA);
        expect(resp.body.Message).toBe("Something went wrong");
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When calendar not found", () => {
      test("Should respond 400", async () => {
        const tokenA = await registerUser(userToRegister[0]);
        const calendarID = "6214f6dca63d387a9ab0dc3a";

        const resp = await api
          .get(`${URI}/${calendarID}`)
          .set("Authorization", tokenA);
        expect(resp.statusCode).toBe(400);
      });

      test("Should respond a Message", async () => {
        const tokenA = await registerUser(userToRegister[0]);
        const calendarID = "6214f6dca63d387a9ab0dc3a";

        const resp = await api
          .get(`${URI}/${calendarID}`)
          .set("Authorization", tokenA);
        expect(resp.body.Message).toBe("Calendar not found");
      });
    });

    describe("When no token is provided", () => {
      const body = cases[0];

      test("Should respond 200", async () => {
        const token = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", token);
        const calendarID = createdCalendar.body.Calendar._id;

        const resp = await api.get(`${URI}/${calendarID}`);
        expect(resp.statusCode).toBe(400);
      });

      test("Should respond an Error", async () => {
        const token = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", token);
        const calendarID = createdCalendar.body.Calendar._id;

        const resp = await api.get(`${URI}/${calendarID}`);
        expect(resp.body.Error).toBe("No token provider");
      });
    });
  });

  describe("POST /", () => {
    describe("When has token and valid data", () => {
      test("Should respond 200", async () => {
        const token = await registerUser(userToRegister[0]);
        for (let body of cases) {
          const resp = await api
            .post(URI)
            .send(body)
            .set("Authorization", token);
          expect(resp.statusCode).toBe(200);
        }
      });

      test("Should respond with a Message and the calendar created", async () => {
        const token = await registerUser(userToRegister[0]);

        for (let body of cases) {
          const resp = await api
            .post(URI)
            .send(body)
            .set("Authorization", token);
          expect(resp.body.Message).toBe("New calendar created");
          expect(resp.body.Calendar.title).toBe(body.title.toLowerCase());
          expect(resp.body.Calendar.description).toBe(body.description);
        }
      });

      test("Should add a new element into the DB", async () => {
        const allBefore = await Calendar.find();
        expect(allBefore).toHaveLength(0);

        const token = await registerUser(userToRegister[0]);

        for (let body of cases) {
          await api.post(URI).send(body).set("Authorization", token);
        }

        const allAfter = await Calendar.find();
        expect(allAfter).toHaveLength(cases.length);
      });
    });

    describe("When has token but data is not sended", () => {
      test("Should respond 400", async () => {
        const token = await registerUser(userToRegister[0]);

        for (let body of badCases) {
          const resp = await api
            .post(URI)
            .send(body)
            .set("Authorization", token);
          expect(resp.statusCode).toBe(400);
        }
      });

      test("Should respond with a Message and an Error", async () => {
        const token = await registerUser(userToRegister[0]);

        for (let body of badCases) {
          const resp = await api
            .post(URI)
            .send(body)
            .set("Authorization", token);
          expect(resp.body.Message).toBe("Something went wrong");
          expect(resp.body.Error).toBeDefined();
        }
      });

      test("Shouldn't add into DB", async () => {
        const token = await registerUser(userToRegister[0]);

        for (let body of badCases) {
          await api.post(URI).send(body).set("Authorization", token);
        }
        const all = await Calendar.find();
        expect(all).toHaveLength(0);
      });
    });

    describe("When no token is provided", () => {
      test("Should respond 400", async () => {
        for (let body of cases) {
          const resp = await api.post(URI).send(body);
          expect(resp.statusCode).toBe(400);
        }
      });

      test("Should respond with a Message", async () => {
        for (let body of badCases) {
          const resp = await api.post(URI).send(body);
          expect(resp.body.Error).toBe("No token provider");
        }
      });

      test("Shouldn't add into DB", async () => {
        for (let body of badCases) {
          await api.post(URI).send(body);
        }
        const all = await Calendar.find();
        expect(all).toHaveLength(0);
      });
    });
  });

  describe("PUT /:id/edit", () => {
    describe("When has token, valid ID and is founder", () => {
      const body = cases[0];

      test("Should respond 200", async () => {
        const token = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", token);
        const calendarID = createdCalendar.body.Calendar._id;

        const newData = {
          title: "Perrosqui",
          description: "Ndeea",
        };

        const resp = await api
          .put(`${URI}/${calendarID}/edit`)
          .send(newData)
          .set("Authorization", token);
        expect(resp.statusCode).toBe(200);
      });

      test("Should respond a Message and the new Calendar ", async () => {
        const token = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", token);
        const calendarID = createdCalendar.body.Calendar._id;

        const newData = {
          title: "Perrosqui",
          description: "Ndeea",
        };

        const resp = await api
          .put(`${URI}/${calendarID}/edit`)
          .send(newData)
          .set("Authorization", token);

        expect(resp.body.Calendar.title).toBe(newData.title.toLowerCase());
        expect(resp.body.Calendar.description).toBe(newData.description);
        expect(resp.body.Message).toBe("Data succesfuly changed");
      });

      test("The calendar name and/or description mush be diferent ", async () => {
        const token = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", token);
        const calendarID = createdCalendar.body.Calendar._id;

        expect(createdCalendar.body.Calendar.title).toBe(
          body.title.toLowerCase()
        );
        expect(createdCalendar.body.Calendar.description).toBeUndefined();

        const newData = {
          title: "Perrosqui",
          description: "Ndeea",
        };

        const resp = await api
          .put(`${URI}/${calendarID}/edit`)
          .send(newData)
          .set("Authorization", token);

        expect(resp.body.Calendar.title).toBe(newData.title.toLowerCase());
        expect(resp.body.Calendar.description).toBe(newData.description);
      });
    });

    describe("When has token, valid ID and is not founder", () => {
      const body = cases[0];

      test("Should respond 400", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const newData = {
          title: "Perrosqui",
          description: "Ndeea",
        };

        const tokenUser = await registerUser(userToRegister[1]);
        const resp = await api
          .put(`${URI}/${calendarID}/edit`)
          .send(newData)
          .set("Authorization", tokenUser);
        expect(resp.statusCode).toBe(400);
      });

      test("Should respond a Message", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const newData = {
          title: "Perrosqui",
          description: "Ndeea",
        };

        const tokenUser = await registerUser(userToRegister[1]);
        const resp = await api
          .put(`${URI}/${calendarID}/edit`)
          .send(newData)
          .set("Authorization", tokenUser);

        expect(resp.body.Message).toBe(
          "Just the founder can change the Calendar's name"
        );
      });

      test("The calendar name and/or description mush not be diferent ", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const initialTitle = body.title.toLowerCase();

        expect(createdCalendar.body.Calendar.title).toBe(initialTitle);
        expect(createdCalendar.body.Calendar.description).toBeUndefined();

        const newData = {
          title: "Perrosqui",
          description: "Ndeea",
        };

        const tokenUser = await registerUser(userToRegister[1]);
        await api
          .put(`${URI}/${calendarID}/edit`)
          .send(newData)
          .set("Authorization", tokenUser);

        const calendar = await Calendar.findById(calendarID);

        expect(calendar!.title).toBe(initialTitle);
        expect(calendar!.description).toBeUndefined();
      });
    });

    describe("When has token, is founder but no data is sended", () => {
      const body = cases[0];

      test("Should respond 400", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const resp = await api
          .put(`${URI}/${calendarID}/edit`)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(400);
      });

      test("Should respond a Message and an Error", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const resp = await api
          .put(`${URI}/${calendarID}/edit`)
          .set("Authorization", tokenFounder);

        expect(resp.body.Message).toBe("Something went wrong");
        expect(resp.body.Error).toBeDefined();
      });

      test("The calendar name and/or description mush not be diferent ", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const initialTitle = body.title.toLowerCase();

        expect(createdCalendar.body.Calendar.title).toBe(initialTitle);
        expect(createdCalendar.body.Calendar.description).toBeUndefined();

        await api
          .put(`${URI}/${calendarID}/edit`)
          .set("Authorization", tokenFounder);

        const calendar = await Calendar.findById(calendarID);

        expect(calendar!.title).toBe(initialTitle);
        expect(calendar!.description).toBeUndefined();
      });
    });

    describe("When no token is provided", () => {
      const body = cases[0];

      test("Should respond 400", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const newData = {
          title: "New Title",
          description: "Desc",
        };

        const resp = await api.put(`${URI}/${calendarID}/edit`).send(newData);
        expect(resp.statusCode).toBe(400);
      });

      test("Should respond with an Error", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const newData = {
          title: "New Title",
          description: "Desc",
        };

        const resp = await api.put(`${URI}/${calendarID}/edit`).send(newData);
        expect(resp.body.Error).toBe("No token provider");
      });

      test("The calendar name and/or description mush not be diferent", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const initialTitle = body.title.toLowerCase();

        expect(createdCalendar.body.Calendar.title).toBe(initialTitle);
        expect(createdCalendar.body.Calendar.description).toBeUndefined();

        const newData = {
          title: "New Title",
          description: "Desc",
        };

        await api.put(`${URI}/${calendarID}/edit`).send(newData);

        const calendar = await Calendar.findById(calendarID);

        expect(calendar!.title).toBe(initialTitle);
        expect(calendar!.description).toBeUndefined();
      });
    });
  });

  describe("POST /:id/addmember", () => {
    describe("When has token, valid data and is founder", () => {
      const body = cases[0];

      test("Should respond 200", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);

        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "invited test",
        };

        const resp = await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(200);
      });

      test("Should add new Invitation into DB", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);

        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "invited test",
        };

        const initialDB = await Invitation.find();
        expect(initialDB).toHaveLength(0);

        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);
        const dbresult = await Invitation.find();
        expect(dbresult).toHaveLength(1);
      });

      test("The user should have a new invitations", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);

        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "invited test",
        };

        const initialUserDB = await User.findById(userID);
        expect(initialUserDB!.invitations).toHaveLength(0);

        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);
        const bdUserResut = await User.findById(userID);
        expect(bdUserResut!.invitations).toHaveLength(1);
      });
    });

    describe("When has token, valid data but is not founder or admin", () => {
      const body = cases[0];
      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);

        const tokenUser2 = await registerUser(userToRegister[2]);
        const userID2 = await getIdByToken(tokenUser2);

        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID2],
          message: "invited test",
        };

        const resp = await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenUser);
        expect(resp.statusCode).toBe(400);
      });

      test("No invitation must be created", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);

        const tokenUser2 = await registerUser(userToRegister[2]);
        const userID2 = await getIdByToken(tokenUser2);

        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID2],
          message: "invited test",
        };

        const resp = await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenUser);

        const initialDB = await Invitation.find();
        expect(initialDB).toHaveLength(0);

        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenUser);
        const dbresult = await Invitation.find();
        expect(dbresult).toHaveLength(0);
      });

      test("Users mustn't have new invitations", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);

        const tokenUser2 = await registerUser(userToRegister[2]);
        const userID2 = await getIdByToken(tokenUser2);

        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID2],
          message: "invited test",
        };

        const initialUserDB = await User.findById(userID2);
        expect(initialUserDB!.invitations).toHaveLength(0);

        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenUser);
        const bdUserResut = await User.findById(userID2);
        expect(bdUserResut!.invitations).toHaveLength(0);
      });
    });

    describe("When has token, is founder but no data is sended", () => {
      const body = cases[0];

      test("Should respond 400", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const resp = await api
          .post(`${URI}/${calendarID}/addmember`)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(400);
      });
    });

    describe("When has token, is founder but user not found", () => {
      const body = cases[0];
      //if one user doesnt found any of them will be invited
      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);

        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const noValidID = "622147b1925c47c4059b8c12";

        const data = {
          members: [noValidID, userID],
          message: "invited test",
        };

        const resp = await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(400);
      });

      test("No invitation must be created", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);

        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const noValidID = "622147b1925c47c4059b8c12";

        const data = {
          members: [noValidID, userID],
          message: "invited test",
        };

        const initialDB = await Invitation.find();
        expect(initialDB).toHaveLength(0);

        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);
        const dbresult = await Invitation.find();
        expect(dbresult).toHaveLength(0);
      });

      test("Users mustn't have new invitations", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);

        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const noValidID = "622147b1925c47c4059b8c12";

        const data = {
          members: [noValidID, userID],
          message: "invited test",
        };

        const initialUserDB = await User.findById(userID);
        expect(initialUserDB!.invitations).toHaveLength(0);

        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);
        const bdUserResut = await User.findById(userID);
        expect(bdUserResut!.invitations).toHaveLength(0);
      });
    });

    describe("When has token, is founder but user was already invited", () => {
      const body = cases[0];

      test("Should respond 200", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);

        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "invited test",
        };

        //First time
        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);
        //Second time
        const resp = await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        expect(resp.statusCode).toBe(200);
      });

      test("No invitation must be created", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);

        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "invited test",
        };

        const databaseOn1 = await Invitation.find();
        expect(databaseOn1).toHaveLength(0);

        //First time
        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const databaseOn2 = await Invitation.find();
        expect(databaseOn2).toHaveLength(1);

        //Second time
        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const databaseOn3 = await Invitation.find();
        expect(databaseOn3).toHaveLength(1);
      });

      test("Users mustn't have new invitations ", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);

        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "invited test",
        };

        const user01 = await User.findById(userID);
        expect(user01!.invitations).toHaveLength(0);

        //First time
        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const user02 = await User.findById(userID);
        expect(user02!.invitations).toHaveLength(1);

        //Second time
        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const user03 = await User.findById(userID);
        expect(user03!.invitations).toHaveLength(1);
      });
    });

    describe("When has token, is founder but user was already part of the calendar", () => {
      const body = cases[0];

      test("Should respond 200", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);

        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "invited test",
        };

        //First time
        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //User accept the invitation
        const allinvits = await Invitation.find();
        await api
          .post(`/api/invitations/${allinvits[0]._id}/accept`)
          .set("Authorization", tokenUser);

        //Second time
        const resp = await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        expect(resp.statusCode).toBe(200);
      });

      test("No invitation must be created", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);

        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "invited test",
        };

        const databaseOn1 = await Invitation.find();
        expect(databaseOn1).toHaveLength(0);

        //First time
        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const databaseOn2 = await Invitation.find();
        expect(databaseOn2).toHaveLength(1);

        //User accept the invitation
        const allinvits = await Invitation.find();
        await api
          .post(`/api/invitations/${allinvits[0]._id}/accept`)
          .set("Authorization", tokenUser);

        //Second time
        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const databaseOn3 = await Invitation.find();
        expect(databaseOn3).toHaveLength(1);
      });

      test("Users mustn't have new invitations ", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);

        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "invited test",
        };

        const user01 = await User.findById(userID);
        expect(user01!.invitations).toHaveLength(0);

        //First time
        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const user02 = await User.findById(userID);
        expect(user02!.invitations).toHaveLength(1);

        //User accept the invitation
        const allinvits = await Invitation.find();
        await api
          .post(`/api/invitations/${allinvits[0]._id}/accept`)
          .set("Authorization", tokenUser);

        //Second time
        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const user03 = await User.findById(userID);
        expect(user03!.invitations).toHaveLength(0);
      });
    });

    describe("When token is not sended", () => {
      const body = cases[0];

      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);

        const tokenFounder = await registerUser(userToRegister[0]);
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "invited test",
        };

        const resp = await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data);
        expect(resp.statusCode).toBe(400);
      });
    });
  });

  describe("DELETE /:id", () => {
    describe("When has token and a valid ID and is founder", () => {
      {/* TODO: "Should respond 200" vie 04 mar 2022 13:25:44  */}
      {/* TODO: "The calendar should desapear from DB" vie 04 mar 2022 13:25:58  */}
      {/* TODO: "The calendar must desapear from its members's list" vie 04 mar 2022 13:26:23  */}
      {/* TODO: "The invitations from this calendar must desapear from user invitations" vie 04 mar 2022 13:27:37  */}
      {/* TODO: "All invitation from this calendar must disapear" vie 04 mar 2022 13:26:53  */}
    });

    describe("When has token a valid ID but is not fouder", () => {
      {/* TODO: "Should respond 400" vie 04 mar 2022 13:25:44  */}
      {/* TODO: "The calendar should not desapear from DB" vie 04 mar 2022 13:25:58  */}
    });

    describe("When has token but bad ID ", () => {
      {/* TODO: "Should respond 400" vie 04 mar 2022 13:25:44  */}
    });

    describe("When has token but calendar not found", () => {
      {/* TODO: "Should respond 400" vie 04 mar 2022 13:25:44  */}
    });

    describe("When token is not provided", () => {
      {/* TODO: "Should respond 400" vie 04 mar 2022 13:25:44  */}
    });
  });
});
