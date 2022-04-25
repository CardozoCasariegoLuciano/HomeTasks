import { api, simpleSetUp} from "./generic_helpers";
import mongoose from "mongoose";
import Calendar from "../src/models/calendar.model";
import Invitation from "../src/models/invitation.model";
import User from "../src/models/user.model";

afterAll(() => {
  mongoose.disconnect();
});

beforeEach(async () => {
  await Calendar.deleteMany({});
  await User.deleteMany({});
  await Invitation.deleteMany({});
});

const URI = "/api/invitations/";
const URIcalendar = "/api/calendar/";

describe("/api/invitation", () => {
  describe("GET /", () => {    
    describe("When has token", () => {
      test("Should respond 200", async () => {
        const {userID, tokenFounder, tokenUser, calendarID} = await simpleSetUp()        

        //inviting user
        const data = {members: [userID]};        
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const resp = await api.get(URI).set("Authorization", tokenUser);
        expect(resp.statusCode).toBe(200);
      });

      test("Should respond a user logued invitations list", async () => {
        const {userID, tokenFounder, tokenUser, calendarID} = await simpleSetUp()        

        //inviting user
        const data = {members: [userID]};        
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
  });

  describe("GET /:id", () => {  
     describe("When have token and valid ID", () => {
      test("Should respond 200", async () => {
        const {userID, tokenFounder, calendarID, tokenUser} = await simpleSetUp()

        const data = {members: [userID]};

        //send invitation
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //Get the invitation ID
        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0];

        const resp = await api
          .get(`${URI}/${inviID}`)
          .set("Authorization", tokenUser);

        expect(resp.statusCode).toBe(200);
      });

      test("Should respond a single object", async () => {
        const {userID, tokenFounder, calendarID, tokenUser} = await simpleSetUp()

        const data = {members: [userID]};

        //send invitation
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //Get the invitation ID
        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0]._id;

        const resp = await api
          .get(`${URI}/${inviID}`)
          .set("Authorization", tokenUser);
        expect(resp.body).toBeInstanceOf(Object);
        expect(resp.body.to).toBe(userID);
        expect(resp.body.from).toBeDefined();
        expect(resp.body.calendarID).toBe(calendarID);
      });
    });

    describe("When a user try to see others invitation", () => {
      test("Should respond 400", async () => {
        const {userID, tokenFounder, calendarID, userNoMemberTk} = await simpleSetUp()

        const data = {members: [userID]};

        //Send invitation
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //Get Invitation ID
        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0]._id;

        const resp = await api
          .get(`${URI}/${inviID}`)
          .set("Authorization", userNoMemberTk);
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });

  describe("POST /:id/accept", () => { 
    describe("When have token and valid ID", () => {
      test("Should return 200", async () => {
        const {userID, tokenFounder, calendarID, tokenUser} = await simpleSetUp()

        const data = {members: [userID]};

        //Send invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //Get invitation ID
        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0];

        //accepting invitation
        const resp = await api
          .post(`${URI}/${inviID}/accept`)
          .set("Authorization", tokenUser);
        //Assertion
        expect(resp.statusCode).toBe(200);
      });

      test("The invitation status must change", async () => {
        const {userID, tokenFounder, calendarID, tokenUser} = await simpleSetUp()

        const data = {members: [userID]};

        //Send invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //Assertion
        const invitationA = await Invitation.findOne({ to: userID });
        const invitationAfterID = invitationA!._id.toString();
        expect(invitationA!.status).toBe("Pending");

        //accepting invitation
        await api
          .post(`${URI}/${invitationAfterID}/accept`)
          .set("Authorization", tokenUser);

        //Assertion
        const invitation = await Invitation.findOne({ to: userID });
        expect(invitation!.status).toBe("Accepted");
      });

      test("The calendar must have a new member", async () => {
        const {userID, tokenFounder, calendarID, tokenUser} = await simpleSetUp()

        const data = {members: [userID]};

        //Send invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //getting invitation ID
        const userInvited = await User.findById(userID);
        const inviID = userInvited!.invitations[0];

        //Assertion
        const calendarAfter = await Calendar.findById(calendarID);
        expect(calendarAfter!.members).toHaveLength(1);

        //accepting invitation
        await api
          .post(`${URI}/${inviID}/accept`)
          .set("Authorization", tokenUser);

        //Assertion
        const calendarBefore = await Calendar.findById(calendarID);
        expect(calendarBefore!.members).toHaveLength(2);
      });

      test("The user must have a new calendar", async () => {
        const {userID, tokenFounder, calendarID, tokenUser} = await simpleSetUp()

        const data = {members: [userID]};

        //Send invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //getting invitation ID
        const userInvited = await User.findById(userID);
        const inviID = userInvited!.invitations[0];

        //Assertion
        expect(userInvited!.calendars).toHaveLength(0);

        //accepting invitation
        await api
          .post(`${URI}/${inviID}/accept`)
          .set("Authorization", tokenUser);

        //Assertion  
        const userInvitedAfter = await User.findById(userID);
        expect(userInvitedAfter!.calendars).toHaveLength(1);
      });

      test("The imvitaion must desappear from user invitation list", async () => {
        const {userID, tokenFounder, calendarID, tokenUser} = await simpleSetUp()

        const data = {members: [userID]};

        //Send invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //getting invitation ID
        const userInvited = await User.findById(userID);
        const inviID = userInvited!.invitations[0];

        //Assertion
        expect(userInvited!.invitations).toHaveLength(1);

        //accepting invitation
        await api
          .post(`${URI}/${inviID}/accept`)
          .set("Authorization", tokenUser);

        //Assertion
        const userInvited2 = await User.findById(userID);
        expect(userInvited2!.invitations).toHaveLength(0);
      });
    });

    describe("When a user try to change others invitation", () => {
      test("Should respond 400", async () => {
        const {userID, tokenFounder, calendarID, userNoMemberTk} = await simpleSetUp()

        const data = {members: [userID]};

        //Sending invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //Get Invitation ID
        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0]._id;
        
        //accepting invitation
        const resp = await api
          .post(`${URI}/${inviID}/accept`)
          .set("Authorization", userNoMemberTk);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    }); 
  });

  describe("POST /:id/reject", () => {
    describe("When have token and valid ID", () => {
      test("Should return 200", async () => {
        const {userID, tokenFounder, calendarID, tokenUser} = await simpleSetUp()
        const data = {members: [userID]};

        //Send invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //Get Invitation ID
        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0];

        //Rejecting invitation
        const resp = await api
          .post(`${URI}/${inviID}/reject`)
          .set("Authorization", tokenUser);
        
        //Assertion
        expect(resp.statusCode).toBe(200);
      });

      test("The invitation status must change", async () => {
        const {userID, tokenFounder, calendarID, tokenUser} = await simpleSetUp()
        const data = {members: [userID]};

        //Send invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //Assertion
        const invi = await Invitation.findOne({ to: userID });
        expect(invi!.status).toBe("Pending");

        //Rejecting invitation
        const resp = await api
          .post(`${URI}/${invi!._id}/reject`)
          .set("Authorization", tokenUser);

        //Assertion
        const invi2 = await Invitation.findOne({ to: userID });
        expect(invi2!.status).toBe("Rejected");
      });

      test("The invitations must desappear from user invitations list", async () => {
        const {userID, tokenFounder, calendarID, tokenUser} = await simpleSetUp()
        const data = {members: [userID]};

        //Send invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //Get invitation ID
        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0];

        //Assertion
        expect(userLoged!.invitations).toHaveLength(1);

        //Rejecting invitation
        await api
          .post(`${URI}/${inviID}/reject`)
          .set("Authorization", tokenUser);

        //Assertion
        const userLogedAfter = await User.findById(userID);
        expect(userLogedAfter!.invitations).toHaveLength(0);
      });

      test("The user must not have other calendar in its list", async () => {
        const {userID, tokenFounder, calendarID, tokenUser} = await simpleSetUp()
        const data = {members: [userID]};

        //Send invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //Get Invitation ID
        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0];

        //Assertion
        expect(userLoged!.calendars).toHaveLength(0);

        //Rejecting invitation
        await api
          .post(`${URI}/${inviID}/reject`)
          .set("Authorization", tokenUser);

        //Assertion
        const userLogedBefore = await User.findById(userID);
        expect(userLogedBefore!.calendars).toHaveLength(0);
      });
    });

    describe("When try to change others invitations", () => {
      test("Should respond 400", async () => {
        const {userID, tokenFounder, calendarID, userNoMemberTk} = await simpleSetUp()
        const data = {members: [userID]};

        //Sending invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //Get invitation ID
        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0]._id;

        //Rejecting invitation
        const resp = await api
          .post(`${URI}/${inviID}/reject`)
          .set("Authorization", userNoMemberTk);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });

  describe("POST /:id  'Show'", () => {
    describe("When have token and valid ID", () => {
      test("Should respond 200", async () => {
        const {userID, tokenFounder, calendarID, tokenUser} = await simpleSetUp()
        const data = {members: [userID]};

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
        
        //Assertion
        expect(resp.statusCode).toBe(200);
      });

      test("the show atribute from invitation must change", async () => {
        const {userID, tokenFounder, calendarID, tokenUser} = await simpleSetUp()
        const data = {members: [userID]};

        //Sending invitation
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //Assertion
        const invitation = await Invitation.findOne({ to: userID });
        expect(invitation!.show).toBeTruthy();

        //Changing show value
        await api
          .post(`${URI}/${invitation!._id}`)
          .set("Authorization", tokenUser);

        //Assertion
        const invitation2 = await Invitation.findOne({ to: userID });
        expect(invitation2!.show).toBeFalsy();
      });

      test("Is a toggle, if do the same again must have the original value", async () => {
        const {userID, tokenFounder, calendarID, tokenUser} = await simpleSetUp()
        const data = {members: [userID]};

        //Sending invitation
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //Assertion
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
        //Assertion
        const invitation3 = await Invitation.findOne({ to: userID });
        expect(invitation3!.show).toBeTruthy();
      });
    });

    describe("When a user try to change others invitation", () => {
      test("Should respond 400", async () => {
        const {userID, tokenFounder, calendarID, userNoMemberTk} = await simpleSetUp()
        const data = {members: [userID]};

        //Sending invitations
        await api
          .post(`${URIcalendar}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        //Get invitation ID
        const userLoged = await User.findById(userID);
        const inviID = userLoged!.invitations[0]._id;

        //Changing show value
        const resp = await api
          .post(`${URI}/${inviID}`)
          .set("Authorization", userNoMemberTk);
        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });
});