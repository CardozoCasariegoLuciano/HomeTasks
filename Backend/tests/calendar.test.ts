import {
  api,
  registerUser,
  setUp,
  simpleSetUp,
  userToRegister,
} from "./generic_helpers";
import mongoose from "mongoose";
import Calendar from "../src/models/calendar.model";
import Invitation from "../src/models/invitation.model";
import User from "../src/models/user.model";
import Task from "../src/models/task.model";

afterAll(() => {
  mongoose.disconnect();
});

beforeEach(async () => {
  await Calendar.deleteMany({});
  await User.deleteMany({});
  await Invitation.deleteMany({});
  await Task.deleteMany({});
});

const URI = "/api/calendar";
const cases = [ { title: "Title1", }, { title: "Title2", description: "Description", } ];
const badCases = [{}, { description: "asdasdasd" }];

describe("/api/calendar", () => {
  describe("GET /:id", () => {
    describe("When has token, valid ID and is part of the calendar", () => {
      test("Should respond 200", async () => {
        const {calendarID, tokenFounder} = await setUp()

        const resp = await api
          .get(`${URI}/${calendarID}`)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(200);
      });

      test("Should respond a calendar", async () => {
        const {calendarID, tokenFounder} = await setUp()

        const resp = await api
          .get(`${URI}/${calendarID}`)
          .set("Authorization", tokenFounder);

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
      test("Should respond 400", async () => {
        const {calendarID, userNoMemberTk} = await setUp()

        const resp = await api
          .get(`${URI}/${calendarID}`)
          .set("Authorization", userNoMemberTk);

        expect(resp.body.Message).toBe("You can not get this Calendar");
        expect(resp.statusCode).toBe(400);
      });
    });
  });

  describe("POST /", () => {
    describe("When has token and valid data", () => {
      test("Should respond 200, a Message and the calendar created", async () => {
        const token = await registerUser(userToRegister[0]);
        for (let body of cases) {
          const resp = await api
            .post(URI)
            .send(body)
            .set("Authorization", token);

          expect(resp.statusCode).toBe(200);
          expect(resp.body.Message).toBe("New calendar created");
          expect(resp.body.Calendar.title).toBe(body.title.toLowerCase());
          expect(resp.body.Calendar.description).toBe(body.description);
        }
      });      

      test("Should add a new element into the DB", async () => {
        const allBefore = await Calendar.find();
        expect(allBefore).toHaveLength(0);

        const token = await registerUser(userToRegister[0]);

        const body = {
          title: "titulo",
        }
      
        await api.post(URI).send(body).set("Authorization", token);
        
        const allAfter = await Calendar.find();
        expect(allAfter).toHaveLength(1);
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
          expect(resp.body.Message).toBe("Something went wrong");
          expect(resp.body.Error).toBeDefined();
        }
      });
    });
  });

  describe("PUT /:id/edit", () => {
    describe("When has token, valid ID and is founder", () => {  
      test("Should respond 200, a Message and the new Calendar", async () => {
        const {calendarID, tokenFounder} = await setUp()

        const newData = {
          title: "Perrosqui",
          description: "Ndeea",
        };

        const resp = await api
          .put(`${URI}/${calendarID}/edit`)
          .send(newData)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(200);
        expect(resp.body.Calendar.title).toBe(newData.title.toLowerCase());
        expect(resp.body.Calendar.description).toBe(newData.description);
        expect(resp.body.Message).toBe("Data succesfuly changed");
      });  

      test("The calendar name and/or description mush be diferent ", async () => {
        const {calendarID, tokenFounder} = await setUp()   
        
        const calendarBefore = await Calendar.findById(calendarID)
        expect(calendarBefore!.description).toBeUndefined()
       
        const newData = {
          title: "Perrosqui",
          description: "Ndeea",
        };

        const resp = await api
          .put(`${URI}/${calendarID}/edit`)
          .send(newData)
          .set("Authorization", tokenFounder);

        expect(resp.body.Calendar.title).toBe(newData.title.toLowerCase());
        expect(resp.body.Calendar.description).toBe(newData.description);
      });
    });

    describe("When has token, valid ID and is not founder", () => {
      test("Should respond 400", async () => {
        const {calendarID, tokenUser} = await setUp()

        const newData = {
          title: "Perrosqui",
          description: "Ndeea",
        };
        
        const resp = await api
          .put(`${URI}/${calendarID}/edit`)
          .send(newData)
          .set("Authorization", tokenUser);
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Message).toBe(
          "Just the founder can change the Calendar's name"
        );
      });   
    });

    describe("When has token, is founder but no data is sended", () => {
      test("Should respond 400", async () => {
        const {calendarID, tokenFounder} = await setUp()

        const resp = await api
          .put(`${URI}/${calendarID}/edit`)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(400);
      });
    });
  });

  describe("POST /:id/addmember", () => {
    describe("When has token, valid data and is founder", () => {
      test("Should respond 200", async () => {
        const {calendarID, userID, tokenFounder} = await simpleSetUp()

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
        const {calendarID, userID, tokenFounder} = await simpleSetUp()

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
        const {calendarID, userID, tokenFounder} = await simpleSetUp()

        const data = {
          members: [userID],
          message: "invited test",
        };

        const bdUserResut1 = await User.findById(userID);
        expect(bdUserResut1!.invitations).toHaveLength(0);

        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const bdUserResut = await User.findById(userID);
        expect(bdUserResut!.invitations).toHaveLength(1);
      });
    });

    describe("When has token, valid data but is not founder", () => {
     test("Should respond 400", async () => {
      const {calendarID, userID, userNoMemberTk} = await simpleSetUp()

        const data = {
          members: [userID],
          message: "invited test",
        };

        const resp = await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", userNoMemberTk);
        expect(resp.statusCode).toBe(400);
      });
    })

    describe("When has token, is founder but no data is sended", () => {
      test("Should respond 400", async () => {
        const {calendarID, tokenFounder} = await simpleSetUp()

        const resp = await api
          .post(`${URI}/${calendarID}/addmember`)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(400);
      });
    });

    describe("When has token, is founder but user was already invited", () => {
      test("Should respond 200", async () => {
        const {calendarID,userID, tokenFounder} = await simpleSetUp()

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

      test("Just one invitation must be created", async () => {
        const {calendarID,userID, tokenFounder} = await simpleSetUp()

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
        //Second time
        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const databaseOn3 = await Invitation.find();
        expect(databaseOn3).toHaveLength(1);
      });

      test("Users mustn't have an invitations twice", async () => {
        const {calendarID,userID, tokenFounder} = await simpleSetUp()

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

        //Second time
        await api
          .post(`${URI}/${calendarID}/addmember`)
          .send(data)
          .set("Authorization", tokenFounder);

        const user02 = await User.findById(userID);
        expect(user02!.invitations).toHaveLength(1);
      });
    });

    describe("When has token, is founder but user was already part of the calendar", () => {
     test("Should respond 200", async () => {
      const {calendarID, userID, tokenUser, tokenFounder} = await simpleSetUp()

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
        const {calendarID, userID, tokenUser, tokenFounder} = await simpleSetUp()

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
        const {calendarID, userID, tokenUser, tokenFounder} = await simpleSetUp()

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
  });

  describe("DELETE /:id", () => {
    describe("When has token and a valid ID and is founder", () => {
     test("Should respond 200", async () => {
      const {calendarID, tokenFounder} = await simpleSetUp()

        const resp = await api
          .delete(`${URI}/${calendarID}`)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(200);
      });

      test("The calendar should desappear from DB", async () => {
        const {calendarID, tokenFounder} = await simpleSetUp()

        const dbAfterDelete = await Calendar.find();
        expect(dbAfterDelete).toHaveLength(1);

        await api
          .delete(`${URI}/${calendarID}`)
          .set("Authorization", tokenFounder);
        const dbBeforeDelete = await Calendar.find();

        expect(dbBeforeDelete).toHaveLength(0);
      });

      test("The calendar should desappear from its members list", async () => {
        const {calendarID, tokenFounder, founderID} = await simpleSetUp()

        const userAfterDelete = await User.findById(founderID);
        expect(userAfterDelete!.calendars).toHaveLength(1);

        await api
          .delete(`${URI}/${calendarID}`)
          .set("Authorization", tokenFounder);
        const userBeforeDelete = await User.findById(founderID);

        expect(userBeforeDelete!.calendars).toHaveLength(0);
      });

      test("Invitations from this calendat must desapear from users invitation list", async () => {
        const {calendarID, tokenFounder, userID} = await simpleSetUp()

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
        const {calendarID, tokenFounder, userID} = await simpleSetUp()

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
      test("Should respond 400", async () => {
        const {calendarID, tokenUser} = await simpleSetUp()

        const resp = await api
          .delete(`${URI}/${calendarID}`)
          .set("Authorization", tokenUser);
        expect(resp.statusCode).toBe(400);
      })
    });
  });

  describe("DELETE /:id/deletemembers", () => {
    describe("When have token, valid calendar ID and valid list of members to delete", () => {
      test("Should return 200", async () => {
        const {calendarID, tokenFounder, userID} = await setUp()

        //Deleting user
        const cases = [{ members: [] }, { members: [userID] }];
        for (let body of cases) {
          const resp = await api
            .delete(`${URI}/${calendarID}/deletemembers`)
            .send(body)
            .set("Authorization", tokenFounder);

          //Assertion
          expect(resp.statusCode).toBe(200);
        }
      });

      test("The member list should have one less member", async () => {
        const {calendarID, tokenUser, userID} = await setUp()

        const calendar = await Calendar.findById(calendarID);
        expect(calendar!.members).toHaveLength(2);

        //Deleting user
        await api
          .delete(`${URI}/${calendarID}/deletemembers`)
          .send({ members: [userID] })
          .set("Authorization", tokenUser);

        //Assertion
        const calendarBefore = await Calendar.findById(calendarID);
        expect(calendarBefore!.members).toHaveLength(1);
      });

      test("The calendar should desappear from the user deleted list", async () => {
        const {calendarID, tokenUser, userID} = await setUp()

        //Assertion
        const user = await User.findById(userID);
        expect(user!.calendars).toHaveLength(1);

        //Deleting user
        const resp = await api
          .delete(`${URI}/${calendarID}/deletemembers`)
          .send({ members: [userID] })
          .set("Authorization", tokenUser);

        //Assertion
        const user2 = await User.findById(userID);
        expect(user2!.calendars).toHaveLength(0);
      });
    });

    describe("When a user try to remove himself", () => {
      test("Should return 200", async () => {
        const {calendarID, tokenUser, userID} = await setUp()

        //Deleting user
        const resp = await api
          .delete(`${URI}/${calendarID}/deletemembers`)
          .send({ members: [userID] })
          .set("Authorization", tokenUser);

        //Assertion
        expect(resp.statusCode).toBe(200);
      });

      test("The member list should have one less member", async () => {
        const {calendarID, tokenUser, userID} = await setUp()

        const calendar = await Calendar.findById(calendarID);
        expect(calendar!.members).toHaveLength(2);

        //Deleting user
        const resp = await api
          .delete(`${URI}/${calendarID}/deletemembers`)
          .send({ members: [userID] })
          .set("Authorization", tokenUser);

        //Assertion
        const calendarBefore = await Calendar.findById(calendarID);
        expect(calendarBefore!.members).toHaveLength(1);
      });

      test("The calendar should desappear from the user deleted list", async () => {
        const {calendarID, tokenUser, userID} = await setUp()

        //Assertion
        const user = await User.findById(userID);
        expect(user!.calendars).toHaveLength(1);

        //Deleting user
        const resp = await api
          .delete(`${URI}/${calendarID}/deletemembers`)
          .send({ members: [userID] })
          .set("Authorization", tokenUser);

        //Assertion
        const user2 = await User.findById(userID);
        expect(user2!.calendars).toHaveLength(0);
      });
    });

    describe("When the founder try to remove himself", () => {
      test("Should return 400", async () => {
        const {calendarID, tokenFounder, founderID} = await setUp()
        //Deleting user
        const resp = await api
          .delete(`${URI}/${calendarID}/deletemembers`)
          .send({ members: [founderID] })
          .set("Authorization", tokenFounder);
          
        //Assertion
        expect(resp.statusCode).toBe(400);
      });
    });

    describe("When regular user try to remove other", () => {
      test("Should return 400", async () => {
        const {calendarID, userID, userNoMemberTk} = await setUp()

        //Deleting user
        const resp = await api
          .delete(`${URI}/${calendarID}/deletemembers`)
          .send({ members: [userID] })
          .set("Authorization", userNoMemberTk);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When have token, valid ID but bad list of members", () => {
      test("Should return 400", async () => {
        const {calendarID, tokenFounder} = await setUp()

        //Deleting user
        const badCases = [
          {},
          { members: "NotAnArray" },
          { members: ["BadID", "OtherBadId"] },
        ];

        for (let body of badCases) {
          const resp = await api
            .delete(`${URI}/${calendarID}/deletemembers`)
            .send(body)
            .set("Authorization", tokenFounder);

          //Assertion
          expect(resp.statusCode).toBe(400);
          expect(resp.body.Error).toBeDefined();
        }
      });
    });
  });

  describe("GET /:id/invitations", () => {    
    describe("When valid calendar ID is sended and is founder", () => {
      test("Should respond  200 and an array", async () => {
        const {calendarID, tokenFounder} = await simpleSetUp()

        //Getting invitations
        const resp = await api
          .get(`${URI}/${calendarID}/invitations`)
          .set("Authorization", tokenFounder);

        //Assertion
        expect(resp.statusCode).toBe(200);
        expect(resp.body.Invitations).toBeInstanceOf(Array);
        expect(resp.body.Invitations).toHaveLength(0);
      }); 
    });     

    describe("When a regular user is loged", () => {
      test("Should respond 400", async () => {
        const {calendarID, tokenUser} = await setUp()

        //Getting invitations
        const resp = await api
          .get(`${URI}/${calendarID}/invitations`)
          .set("Authorization", tokenUser);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });

  describe("GET /:id/table", () => {
    describe("When all data is ok", () => {
      test("should return 200", async()=>{
        const {calendarID, tokenFounder} = await setUp()

        const resp = await api.get(`${URI}/${calendarID}/table`).set("Authorization", tokenFounder)
        expect(resp.statusCode).toBe(200)
      })

      test("should return an array", async()=>{
        const {calendarID, tokenFounder} = await setUp()

        const resp = await api.get(`${URI}/${calendarID}/table`).set("Authorization", tokenFounder)
        expect(resp.body).toBeInstanceOf(Array)
      })

      test("All items are activities from the calendar in URL", async()=>{
        const {calendarID, tokenFounder} = await setUp()

        const resp = await api.get(`${URI}/${calendarID}/table`).set("Authorization", tokenFounder)
        for (let act of resp.body) {
          expect(act.calendar_id).toBe(calendarID)
          expect(act.user).toBeDefined()
          expect(act.activities.mondays).toBeDefined()
          expect(act.activities.fridays).toBeDefined()
        }
      })
    })

    describe("When a user who is not part of the calendar try to get data", () => {
      test("should return 400", async()=>{
        const {calendarID, userNoMemberTk} = await setUp()

        const resp = await api.get(`${URI}/${calendarID}/table`).set("Authorization", userNoMemberTk)
        expect(resp.statusCode).toBe(400)
      })
    })
  })
});
