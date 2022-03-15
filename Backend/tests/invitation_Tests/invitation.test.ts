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
import { URI, URIcalendar } from "./utils";

afterAll(() => {
  mongoose.disconnect();
});

beforeEach(async () => {
  await Calendar.deleteMany({});
  await User.deleteMany({});
  await Invitation.deleteMany({});
});

describe("/api/invitation", () => {
  describe("GET /", () => {
    const body = {
      title: "Titulo",
      description: "Description",
    };
    describe("When has token", () => {
      test("Should respond 200", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const resp = await api.get(URI).set("Authorization", tokenUser);
        expect(resp.statusCode).toBe(200);
      });

      test("Should respond a user logued invitations list", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const resp = await api.get(URI).set("Authorization", tokenUser);
        expect(resp.body).toBeInstanceOf(Array);
        expect(resp.body).toHaveLength(1);
        expect(resp.body[0].to).toBe(userID);
      });
    });

    describe("When have no token", () => {
      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        //send the invitation
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //Get the invitations (to token)
        const resp = await api.get(URI);
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });

  describe("GET /:id", () => {
    const body = {
      title: "Titulo",
      description: "Description",
    };

    describe("When have token and valid ID", () => {
      test("Should respond 200", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0];

        const resp = await api
          .get(`${URI}/${inviID}`)
          .set("Authorization", tokenUser);
        expect(resp.statusCode).toBe(200);
      });

      test("Should respond a single object", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0]._id;

        const resp = await api
          .get(`${URI}/${inviID}`)
          .set("Authorization", tokenUser);
        expect(resp.body).toBeInstanceOf(Object);
        expect(resp.body.to).toBe(userID);
        expect(resp.body.from).toBeDefined();
        expect(resp.body.calendarID).toBeDefined();
        expect(resp.body.message).toBe(data.message);
        expect(resp.body.calendarName).toBe(body.title.toLowerCase());
      });
    });

    describe("When a user try to see others invitation", () => {
      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);
        const otherUserToken = await registerUser(userToRegister[2]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0]._id;

        const resp = await api
          .get(`${URI}/${inviID}`)
          .set("Authorization", otherUserToken);
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When have token but invalid ID", () => {
      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const inviID = "INvalidId";

        const resp = await api
          .get(`${URI}/${inviID}`)
          .set("Authorization", tokenUser);
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When have token but invitation not found", () => {
      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const inviID = "621fd14ec7e3fc74cd9189ac";

        const resp = await api
          .get(`${URI}/${inviID}`)
          .set("Authorization", tokenUser);
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Message).toBeDefined();
      });
    });

    describe("When no token provided", () => {
      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0]._id;

        const resp = await api.get(`${URI}/${inviID}`);
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });

  describe("POST /:id/accept", () => {
    const body = {
      title: "Titulo",
      description: "Description",
    };

    describe("When have token and valid ID", () => {
      test("Should return 200", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        //Send invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0];

        //accepting invitation
        const resp = await api
          .post(`${URI}/${inviID}/accept`)
          .set("Authorization", tokenUser);
        expect(resp.statusCode).toBe(200);
      });

      test("The invitation status must change", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        //Send invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const invitationA = await Invitation.findOne({ to: userID });
        const invitationAfterID = invitationA!._id.toString();
        expect(invitationA!.status).toBe("Pending");

        //accepting invitation
        await api
          .post(`${URI}/${invitationAfterID}/accept`)
          .set("Authorization", tokenUser);

        const invitation = await Invitation.findOne({ to: userID });
        expect(invitation!.status).toBe("Accepted");
      });

      test("The calendar must have a new member", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        //Send invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //getting invitation ID
        const userInvited = await User.findById(userID);
        const inviID = userInvited!.invitations[0];

        const calendarAfter = await Calendar.findById(calendarID);
        expect(calendarAfter!.members).toHaveLength(1);

        //accepting invitation
        await api
          .post(`${URI}/${inviID}/accept`)
          .set("Authorization", tokenUser);

        const calendarBefore = await Calendar.findById(calendarID);
        expect(calendarBefore!.members).toHaveLength(2);
      });

      test("The user must have a new calendar", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        //Send invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //getting invitation ID
        const userInvited = await User.findById(userID);
        const inviID = userInvited!.invitations[0];

        expect(userInvited!.calendars).toHaveLength(0);

        //accepting invitation
        await api
          .post(`${URI}/${inviID}/accept`)
          .set("Authorization", tokenUser);

        const userInvited2 = await User.findById(userID);
        expect(userInvited2!.calendars).toHaveLength(1);
      });

      test("The imvitaion must desappear from user invitation list", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        //Send invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //getting invitation ID
        const userInvited = await User.findById(userID);
        const inviID = userInvited!.invitations[0];

        expect(userInvited!.invitations).toHaveLength(1);

        //accepting invitation
        await api
          .post(`${URI}/${inviID}/accept`)
          .set("Authorization", tokenUser);

        const userInvited2 = await User.findById(userID);
        expect(userInvited2!.invitations).toHaveLength(0);
      });
    });

    describe("When a user try to change others invitation", () => {
      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);
        const otherUserToken = await registerUser(userToRegister[2]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        //Sending invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0]._id;

        const resp = await api
          .post(`${URI}/${inviID}/accept`)
          .set("Authorization", otherUserToken);
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When have token but invalid ID", () => {
      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const inviID = "INvalidId";

        const resp = await api
          .post(`${URI}/${inviID}/accept`)
          .set("Authorization", tokenUser);
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When have token but invitation not found", () => {
      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const inviID = "621fd14ec7e3fc74cd9189ac";

        const resp = await api
          .post(`${URI}/${inviID}/accept`)
          .set("Authorization", tokenUser);
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Message).toBeDefined();
      });
    });

    describe("When no token provided", () => {
      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0]._id;

        const resp = await api.post(`${URI}/${inviID}/accept`);
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });

  describe("POST /:id/reject", () => {
    const body = {
      title: "Titulo",
      description: "Description",
    };

    describe("When have token and valid ID", () => {
      test("Should return 200", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        //Send invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0];

        //Rejecting invitation
        const resp = await api
          .post(`${URI}/${inviID}/reject`)
          .set("Authorization", tokenUser);
        expect(resp.statusCode).toBe(200);
      });

      test("The invitation status must change", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        //Send invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const invi = await Invitation.findOne({ to: userID });
        expect(invi!.status).toBe("Pending");

        //Rejecting invitation
        const resp = await api
          .post(`${URI}/${invi!._id}/reject`)
          .set("Authorization", tokenUser);

        const invi2 = await Invitation.findOne({ to: userID });
        expect(invi2!.status).toBe("Rejected");
      });

      test("The invitations must desappear from user invitations list", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        //Send invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0];
        expect(userLoged!.invitations).toHaveLength(1);

        //Rejecting invitation
        await api
          .post(`${URI}/${inviID}/reject`)
          .set("Authorization", tokenUser);

        const userLogedBefore = await User.findById(userID);
        expect(userLogedBefore!.invitations).toHaveLength(0);
      });

      test("The user must not have other calendar in its list", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        //Send invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0];
        expect(userLoged!.calendars).toHaveLength(0);

        //Rejecting invitation
        await api
          .post(`${URI}/${inviID}/reject`)
          .set("Authorization", tokenUser);

        const userLogedBefore = await User.findById(userID);
        expect(userLogedBefore!.calendars).toHaveLength(0);
      });
    });

    describe("When try to change others invitations", () => {
      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);
        const otherUserToken = await registerUser(userToRegister[2]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        //Sending invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0]._id;

        //Rejecting invitation
        const resp = await api
          .post(`${URI}/${inviID}/reject`)
          .set("Authorization", otherUserToken);

        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When have token but bad ID", () => {
      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const inviID = "INvalidId";

        const resp = await api
          .post(`${URI}/${inviID}/reject`)
          .set("Authorization", tokenUser);
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When have token but invitation not found", () => {
      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const inviID = "621fd14ec7e3fc74cd9189ac";

        const resp = await api
          .post(`${URI}/${inviID}/reject`)
          .set("Authorization", tokenUser);
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Message).toBeDefined();
      });
    });

    describe("When no token provided", () => {
      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0]._id;

        const resp = await api.post(`${URI}/${inviID}/reject`);
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });

  describe("POST /:id", () => {
    const body = {
      title: "Titulo",
      description: "Description",
    };

    describe("When have token and valid ID", () => {
      test("Should respond 200", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        //Sending invitation
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const invitation = await Invitation.findOne({ to: userID });

        //Changing show value
        const resp = await api
          .post(`${URI}/${invitation!._id}`)
          .set("Authorization", tokenUser);
        expect(resp.statusCode).toBe(200);
      });

      test("the show atribute from invitation must change", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        //Sending invitation
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const invitation = await Invitation.findOne({ to: userID });
        expect(invitation!.show).toBeTruthy();

        //Changing show value
        await api
          .post(`${URI}/${invitation!._id}`)
          .set("Authorization", tokenUser);
        const invitation2 = await Invitation.findOne({ to: userID });
        expect(invitation2!.show).toBeFalsy();
      });

      test("Is a toggle, if do the same again must have the original value", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        //Sending invitation
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const invitation = await Invitation.findOne({ to: userID });
        expect(invitation!.show).toBeTruthy();

        //Changing show value
        await api
          .post(`${URI}/${invitation!._id}`)
          .set("Authorization", tokenUser);
        const invitation2 = await Invitation.findOne({ to: userID });
        expect(invitation2!.show).toBeFalsy();

        //Changing show value again
        await api
          .post(`${URI}/${invitation!._id}`)
          .set("Authorization", tokenUser);
        const invitation3 = await Invitation.findOne({ to: userID });
        expect(invitation3!.show).toBeTruthy();
      });
    });

    describe("When a user try to change others invitation", () => {
      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);
        const otherUserToken = await registerUser(userToRegister[2]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        //Sending invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0]._id;

        //Changing show value
        const resp = await api
          .post(`${URI}/${inviID}`)
          .set("Authorization", otherUserToken);
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When have token but invalid ID", () => {
      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const inviID = "INvalidId";

        const resp = await api
          .post(`${URI}/${inviID}`)
          .set("Authorization", tokenUser);
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When have token but invitation not found", () => {
      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const inviID = "621fd14ec7e3fc74cd9189ac";

        const resp = await api
          .post(`${URI}/${inviID}`)
          .set("Authorization", tokenUser);
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Message).toBeDefined();
      });
    });

    describe("When no token provided", () => {
      test("Should respond 400", async () => {
        const tokenUser = await registerUser(userToRegister[1]);
        const userID = await getIdByToken(tokenUser);
        const tokenFounder = await registerUser(userToRegister[0]);

        //Creating a calendar
        const createdCalendar = await api
          .post(URIcalendar)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        const data = {
          members: [userID],
          message: "Invitation Test",
        };

        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0]._id;

        const resp = await api.post(`${URI}/${inviID}`);
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });
});
