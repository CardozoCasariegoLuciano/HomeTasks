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
      const body = cases[0];

      test("Should respond 200", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);
        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const resp = await api
          .delete(`${URI}/${calendarID}`)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(200);
      });

      test("The calendar should desappear from DB", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);
        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const dbAfterDelete = await Calendar.find();
        expect(dbAfterDelete).toHaveLength(1);

        await api
          .delete(`${URI}/${calendarID}`)
          .set("Authorization", tokenFounder);
        const dbBeforeDelete = await Calendar.find();
        expect(dbBeforeDelete).toHaveLength(0);
      });

      test("The calendar should desappear from its members list", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);
        const founderID = await getIdByToken(tokenFounder);
        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const userAfterDelete = await User.findById(founderID);
        expect(userAfterDelete!.calendars).toHaveLength(1);

        await api
          .delete(`${URI}/${calendarID}`)
          .set("Authorization", tokenFounder);
        const userBeforeDelete = await User.findById(founderID);
        expect(userBeforeDelete!.calendars).toHaveLength(0);
      });

      test("Invitations from this calendat must desapear from users invitation list", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);

        const tokenFounder = await registerUser(userToRegister[0]);
        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send({ members: [userID] })
          .set("Authorization", tokenFounder);

        const userAfterDelete = await User.findById(userID);
        expect(userAfterDelete!.invitations).toHaveLength(1);

        await api
          .delete(`${URI}/${calendarID}`)
          .set("Authorization", tokenFounder);
        const userBeforeDelete = await User.findById(userID);
        expect(userBeforeDelete!.invitations).toHaveLength(0);
      });

      test("All invitation from this calendar should desappear from DB", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);

        const tokenFounder = await registerUser(userToRegister[0]);
        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send({ members: [userID] })
          .set("Authorization", tokenFounder);

        const dbAfterDelete = await Invitation.find();
        expect(dbAfterDelete).toHaveLength(1);

        await api
          .delete(`${URI}/${calendarID}`)
          .set("Authorization", tokenFounder);
        const dbBeforeDelete = await Invitation.find();
        expect(dbBeforeDelete).toHaveLength(0);
      });
    });

    describe("When has token a valid ID but is not fouder", () => {
      const body = cases[0];

      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const resp = await api
          .delete(`${URI}/${calendarID}`)
          .set("Authorization", tokenUser);
        expect(resp.statusCode).toBe(400);
      });

      test("The calendar should not desappear from DB", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const dbAfterDelete = await Calendar.find();
        expect(dbAfterDelete).toHaveLength(1);

        await api
          .delete(`${URI}/${calendarID}`)
          .set("Authorization", tokenUser);

        const dbBeforeDelete = await Calendar.find();
        expect(dbBeforeDelete).toHaveLength(1);
      });
    });

    describe("When has token but bad ID ", () => {
      const body = cases[0];

      test("Should return 400", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);
        const badID = "suPerBAADId";

        const resp = await api
          .delete(`${URI}/${badID}`)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(400);
      });
    });

    describe("When has token but calendar not found", () => {
      const body = cases[0];

      test("Should return 400", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);
        const badID = "621fd14ec7e3fc74cd9189ac";

        const resp = await api
          .delete(`${URI}/${badID}`)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(400);
      });
    });

    describe("When token is not provided", () => {
      const body = cases[0];

      test("Should return 400", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const resp = await api.delete(`${URI}/${calendarID}`);
        expect(resp.statusCode).toBe(400);
      });
    });
  });

  describe("DELETE /:id/deletemembers", () => {
    const body = cases[0];

    describe("When have token, valid calendar ID and valid list of members to delete", () => {
      test("Should return 200", async () => {
        const founderToken = await registerUser(userToRegister[0]);
        const userToken = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(userToken);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendaID = createdCalendar.body.Calendar._id;

        //inviting user
        await api
          .post(`${URI}/${calendaID}/addmember`)
          .send({ members: [userID] })
          .set("Authorization", founderToken);

        //aceppting invitation
        const invitation = await Invitation.findOne({ to: userID });
        const inviID = invitation!._id;
        await api
          .post(`/api/invitations/${inviID}/accept`)
          .set("Authorization", userToken);

        //Deleting user
        const cases = [{ members: [] }, { members: [userID] }];
        for (let body of cases) {
          const resp = await api
            .delete(`${URI}/${calendaID}/deletemembers`)
            .send(body)
            .set("Authorization", founderToken);

          //Assertion
          expect(resp.statusCode).toBe(200);
        }
      });

      test("The member list should have one less member", async () => {
        const founderToken = await registerUser(userToRegister[0]);
        const userToken = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(userToken);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendaID = createdCalendar.body.Calendar._id;

        //inviting user
        await api
          .post(`${URI}/${calendaID}/addmember`)
          .send({ members: [userID] })
          .set("Authorization", founderToken);

        //aceppting invitation
        const invitation = await Invitation.findOne({ to: userID });
        const inviID = invitation!._id;
        await api
          .post(`/api/invitations/${inviID}/accept`)
          .set("Authorization", userToken);

        const calendar = await Calendar.findById(calendaID);
        expect(calendar!.members).toHaveLength(2);

        //Deleting user
        const resp = await api
          .delete(`${URI}/${calendaID}/deletemembers`)
          .send({ members: [userID] })
          .set("Authorization", founderToken);

        //Assertion
        const calendarBefore = await Calendar.findById(calendaID);
        expect(calendarBefore!.members).toHaveLength(1);
      });

      test("The calendar should desappear from the user deleted list", async () => {
        const founderToken = await registerUser(userToRegister[0]);
        const userToken = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(userToken);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendaID = createdCalendar.body.Calendar._id;

        //inviting user
        await api
          .post(`${URI}/${calendaID}/addmember`)
          .send({ members: [userID] })
          .set("Authorization", founderToken);

        //aceppting invitation
        const invitation = await Invitation.findOne({ to: userID });
        const inviID = invitation!._id;
        await api
          .post(`/api/invitations/${inviID}/accept`)
          .set("Authorization", userToken);

        //Assertion
        const user = await User.findById(userID);
        expect(user!.calendars).toHaveLength(1);

        //Deleting user
        const resp = await api
          .delete(`${URI}/${calendaID}/deletemembers`)
          .send({ members: [userID] })
          .set("Authorization", founderToken);

        //Assertion
        const user2 = await User.findById(userID);
        expect(user2!.calendars).toHaveLength(0);
      });
    });

    describe("When a user try to remove himself", () => {
      test("Should return 200", async () => {
        const founderToken = await registerUser(userToRegister[0]);
        const userToken = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(userToken);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendaID = createdCalendar.body.Calendar._id;

        //inviting user
        await api
          .post(`${URI}/${calendaID}/addmember`)
          .send({ members: [userID] })
          .set("Authorization", founderToken);

        //aceppting invitation
        const invitation = await Invitation.findOne({ to: userID });
        const inviID = invitation!._id;
        await api
          .post(`/api/invitations/${inviID}/accept`)
          .set("Authorization", userToken);

        //Deleting user
        const resp = await api
          .delete(`${URI}/${calendaID}/deletemembers`)
          .send({ members: [userID] })
          .set("Authorization", userToken);

        //Assertion
        expect(resp.statusCode).toBe(200);
      });

      test("The member list should have one less member", async () => {
        const founderToken = await registerUser(userToRegister[0]);
        const userToken = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(userToken);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendaID = createdCalendar.body.Calendar._id;

        //inviting user
        await api
          .post(`${URI}/${calendaID}/addmember`)
          .send({ members: [userID] })
          .set("Authorization", founderToken);

        //aceppting invitation
        const invitation = await Invitation.findOne({ to: userID });
        const inviID = invitation!._id;
        await api
          .post(`/api/invitations/${inviID}/accept`)
          .set("Authorization", userToken);

        const calendar = await Calendar.findById(calendaID);
        expect(calendar!.members).toHaveLength(2);

        //Deleting user
        const resp = await api
          .delete(`${URI}/${calendaID}/deletemembers`)
          .send({ members: [userID] })
          .set("Authorization", userToken);

        //Assertion
        const calendarBefore = await Calendar.findById(calendaID);
        expect(calendarBefore!.members).toHaveLength(1);
      });

      test("The calendar should desappear from the user deleted list", async () => {
        const founderToken = await registerUser(userToRegister[0]);
        const userToken = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(userToken);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendaID = createdCalendar.body.Calendar._id;

        //inviting user
        await api
          .post(`${URI}/${calendaID}/addmember`)
          .send({ members: [userID] })
          .set("Authorization", founderToken);

        //aceppting invitation
        const invitation = await Invitation.findOne({ to: userID });
        const inviID = invitation!._id;
        await api
          .post(`/api/invitations/${inviID}/accept`)
          .set("Authorization", userToken);

        //Assertion
        const user = await User.findById(userID);
        expect(user!.calendars).toHaveLength(1);

        //Deleting user
        const resp = await api
          .delete(`${URI}/${calendaID}/deletemembers`)
          .send({ members: [userID] })
          .set("Authorization", userToken);

        //Assertion
        const user2 = await User.findById(userID);
        expect(user2!.calendars).toHaveLength(0);
      });
    });

    describe("When the founder try to remove himself", () => {
      test("Should return 400", async () => {
        const founderToken = await registerUser(userToRegister[0]);
        const founderID = await getIdByToken(founderToken);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendaID = createdCalendar.body.Calendar._id;

        //Deleting user
        const resp = await api
          .delete(`${URI}/${calendaID}/deletemembers`)
          .send({ members: [founderID] })
          .set("Authorization", founderToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
      });
    });

    describe("When regular user try to remove other", () => {
      test("Should return 400", async () => {
        const founderToken = await registerUser(userToRegister[0]);
        const otherUserToken = await registerUser(userToRegister[2]);
        const userToken = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(userToken);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendaID = createdCalendar.body.Calendar._id;

        //inviting user
        await api
          .post(`${URI}/${calendaID}/addmember`)
          .send({ members: [userID] })
          .set("Authorization", founderToken);

        //aceppting invitation
        const invitation = await Invitation.findOne({ to: userID });
        const inviID = invitation!._id;
        await api
          .post(`/api/invitations/${inviID}/accept`)
          .set("Authorization", userToken);

        //Deleting user
        const resp = await api
          .delete(`${URI}/${calendaID}/deletemembers`)
          .send({ members: [userID] })
          .set("Authorization", otherUserToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When have token, valid ID but bad list of members", () => {
      test("Should return 400", async () => {
        const founderToken = await registerUser(userToRegister[0]);
        const userToken = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(userToken);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendaID = createdCalendar.body.Calendar._id;

        //inviting user
        await api
          .post(`${URI}/${calendaID}/addmember`)
          .send({ members: [userID] })
          .set("Authorization", founderToken);

        //aceppting invitation
        const invitation = await Invitation.findOne({ to: userID });
        const inviID = invitation!._id;
        await api
          .post(`/api/invitations/${inviID}/accept`)
          .set("Authorization", userToken);

        //Deleting user
        const badCases = [
          {},
          { members: "NotAnArray" },
          { members: ["BadID", "OtherBadId"] },
        ];

        for (let body of badCases) {
          const resp = await api
            .delete(`${URI}/${calendaID}/deletemembers`)
            .send(body)
            .set("Authorization", founderToken);

          //Assertion
          expect(resp.statusCode).toBe(400);
          expect(resp.body.Error).toBeDefined();
        }
      });
    });

    describe("When have token, valid data but bad calendarID", () => {
      test("Should return 400", async () => {
        const founderToken = await registerUser(userToRegister[0]);
        const userToken = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(userToken);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendaID = createdCalendar.body.Calendar._id;

        //inviting user
        await api
          .post(`${URI}/${calendaID}/addmember`)
          .send({ members: [userID] })
          .set("Authorization", founderToken);

        //aceppting invitation
        const invitation = await Invitation.findOne({ to: userID });
        const inviID = invitation!._id;
        await api
          .post(`/api/invitations/${inviID}/accept`)
          .set("Authorization", userToken);

        //Deleting user
        const badCalendID = "a9999sdasdkajsfa";

        const resp = await api
          .delete(`${URI}/${badCalendID}/deletemembers`)
          .send({ members: [userID] })
          .set("Authorization", founderToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When have token, valid data but calendar not found", () => {
      test("Should return 400", async () => {
        const founderToken = await registerUser(userToRegister[0]);
        const userToken = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(userToken);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendaID = createdCalendar.body.Calendar._id;

        //inviting user
        await api
          .post(`${URI}/${calendaID}/addmember`)
          .send({ members: [userID] })
          .set("Authorization", founderToken);

        //aceppting invitation
        const invitation = await Invitation.findOne({ to: userID });
        const inviID = invitation!._id;
        await api
          .post(`/api/invitations/${inviID}/accept`)
          .set("Authorization", userToken);

        //Deleting user
        const badCalendID = "622147b1925c47c4059b8c12";

        const resp = await api
          .delete(`${URI}/${badCalendID}/deletemembers`)
          .send({ members: [userID] })
          .set("Authorization", founderToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Message).toBeDefined();
      });
    });

    describe("When no token provided", () => {
      const body = cases[0];

      test("Should return 400", async () => {
        const founderToken = await registerUser(userToRegister[0]);
        const userToken = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(userToken);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendaID = createdCalendar.body.Calendar._id;

        //inviting user
        await api
          .post(`${URI}/${calendaID}/addmember`)
          .send({ members: [userID] })
          .set("Authorization", founderToken);

        //aceppting invitation
        const invitation = await Invitation.findOne({ to: userID });
        const inviID = invitation!._id;
        await api
          .post(`/api/invitations/${inviID}/accept`)
          .set("Authorization", userToken);

        //Deleting user
        const resp = await api
          .delete(`${URI}/${calendaID}/deletemembers`)
          .send({ members: [userID] });

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });

  describe("GET /:id/invitations", () => {
    const body = cases[0];

    describe("When valid calendar ID is sended and is founder", () => {
      test("Should respond  200", async () => {
        const founderToken = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendaID = createdCalendar.body.Calendar._id;

        //Getting invitations
        const resp = await api
          .get(`${URI}/${calendaID}/invitations`)
          .set("Authorization", founderToken);

        //Assertion
        expect(resp.statusCode).toBe(200);
      });

      test("Should respond with an array", async () => {
        const founderToken = await registerUser(userToRegister[0]);
        const userToken = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(userToken);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendaID = createdCalendar.body.Calendar._id;

        //inviting user
        await api
          .post(`${URI}/${calendaID}/addmember`)
          .send({ members: [userID] })
          .set("Authorization", founderToken);

        //Getting invitations
        const resp = await api
          .get(`${URI}/${calendaID}/invitations`)
          .set("Authorization", founderToken);

        //Assertion
        expect(resp.body.Invitations).toBeInstanceOf(Array);
        expect(resp.body.Invitations).toHaveLength(1);
      });
    });

    describe("When calendar not found", () => {
      test("Should respond  400", async () => {
        const founderToken = await registerUser(userToRegister[0]);

        const badID = "621fd14ec7e3fc74cd9189ac";

        //Getting invitations
        const resp = await api
          .get(`${URI}/${badID}/invitations`)
          .set("Authorization", founderToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Message).toBeDefined();
      });
    });

    describe("When no valid ID", () => {
      test("Should respond  400", async () => {
        const founderToken = await registerUser(userToRegister[0]);

        const badID = "NoValidID";

        //Getting invitations
        const resp = await api
          .get(`${URI}/${badID}/invitations`)
          .set("Authorization", founderToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When a regular user is loged", () => {
      test("Should respond 400", async () => {
        const founderToken = await registerUser(userToRegister[0]);
        const userToken = await registerUser(userToRegister[1]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendaID = createdCalendar.body.Calendar._id;

        //Getting invitations
        const resp = await api
          .get(`${URI}/${calendaID}/invitations`)
          .set("Authorization", userToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When no token provided", () => {
      test("Should respond 400", async () => {
        const founderToken = await registerUser(userToRegister[0]);
        const userToken = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(userToken);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendaID = createdCalendar.body.Calendar._id;

        //Getting invitations
        const resp = await api.get(`${URI}/${calendaID}/invitations`);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });

  describe("POST /:id/addtask", () => {
    const body = cases[0];

    describe("When has token, valid calendar ID and valid Data", () => {
      test("Should respond 200", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendaID = createdCalendar.body.Calendar._id;

        const data = {
          title: "titulo",
          description: "descripcion",
        };

        const resp = await api
          .post(`${URI}/${calendaID}/addtask`)
          .send(data)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(200);
      });

      test("should add a new element on Calendar tasks list", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendaID = createdCalendar.body.Calendar._id;

        //Assertion
        expect(createdCalendar.body.Calendar.tasks).toHaveLength(0);

        //Adding new tasks
        const data = [
          {
            title: "titulo1",
            description: "descripcion1",
          },
          {
            title: "titulo3",
          },
          {
            title: "titulo2",
            description: "descripcion2",
            options: ["baño", "Cocina"],
          },
        ];

        for (let dataCase of data) {
          await api
            .post(`${URI}/${calendaID}/addtask`)
            .send(dataCase)
            .set("Authorization", tokenFounder);
        }

        //assertion
        const resp = await Calendar.findById(calendaID);
        expect(resp!.tasks).toHaveLength(data.length);
      });
    });

    describe("When has token, valid Calendar ID but no valid Data", () => {
      test("Should respond 400 with no valid data", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendaID = createdCalendar.body.Calendar._id;

        // Creating a task with wrong data
        const dataCases = [
          { title: 123123 },
          {},
          {
            title: "Valid",
            options: [123, 32123],
          },
          { title: "Valed", description: 12312313 },
        ];

        for (let data of dataCases) {
          const resp = await api
            .post(`${URI}/${calendaID}/addtask`)
            .send(data)
            .set("Authorization", tokenFounder);

          console.log(resp.body);
          //Assertion
          expect(resp.statusCode).toBe(400);
        }
      });
    });

    describe("When calendar not found", () => {
      test("Should respond  400", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);

        const badID = "621fd14ec7e3fc74cd9189ac";

        //Try to add new task

        const data = {
          title: "algo",
        };

        const resp = await api
          .post(`${URI}/${badID}/addtask`)
          .send(data)
          .set("Authorization", tokenFounder);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Message).toBeDefined();
      });
    });

    describe("When no valid calendar ID", () => {
      test("Should respond  400", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);

        const badID = "a91923sdasdqweasd";

        //Try to add new task

        const data = {
          title: "algo",
        };

        const resp = await api
          .post(`${URI}/${badID}/addtask`)
          .send(data)
          .set("Authorization", tokenFounder);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When a regular user try to add a task", () => {
      test("Should respond 400", async () => {
        const founderToken = await registerUser(userToRegister[0]);
        const userToken = await registerUser(userToRegister[1]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendaID = createdCalendar.body.Calendar._id;

        //Creating a tasks
        const data = {title: "algoo"}

        const resp = await api
          .post(`${URI}/${calendaID}/addtask`)
          .send(data)
          .set("Authorization", userToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    })

    describe("When no token provided", () => {
      test("Should respond 400", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendaID = createdCalendar.body.Calendar._id;

        const data = {
          title: "titulo",
          description: "descripcion",
        };

        const resp = await api
          .post(`${URI}/${calendaID}/addtask`)
          .send(data)

        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });
});
