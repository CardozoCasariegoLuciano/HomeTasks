import { api, setUp} from "./generic_helpers";
import mongoose from "mongoose";
import Calendar from "../src/models/calendar.model";
import Invitation from "../src/models/invitation.model";
import User from "../src/models/user.model";
import Todo from "../src/models/tasktoDo.model";

afterAll(() => {
  mongoose.disconnect();
});

beforeEach(async () => {
  await Calendar.deleteMany({});
  await User.deleteMany({});
  await Invitation.deleteMany({});
  await Todo.deleteMany({})
});

const URI = "/api/activities/"

describe("/api/activities/", () => {
  describe("GET /", () => {
    describe("When have token and valid ID", () => {
      test("Should return 200", async()=>{
        const {tokenUser} = await setUp()
        const resp = await api.get(URI).set("Authorization", tokenUser)

        expect(resp.statusCode).toBe(200)
      })

      test("Should return a list", async()=>{
        const {tokenUser} = await setUp()
        const resp = await api.get(URI).set("Authorization", tokenUser)

        expect(resp.body).toBeInstanceOf(Array)
      })

      test("Should return an empty list if the user have no activities", async()=>{
        const {userNoMemberTk} = await setUp()
        const resp = await api.get(URI).set("Authorization", userNoMemberTk)

        expect(resp.body).toBeInstanceOf(Array)
        expect(resp.body).toHaveLength(0)
      })
    })
  })

  describe("GET /activity/:id/:todoID", () => {
    describe("When have token and valid ID", () => {
      test("Should return 200", async()=>{
        const {tokenUser, createdActivity} = await setUp()
        const mondayFstToDo = createdActivity.activities.mondays[0]

        const resp = await api.get(`${URI}/${createdActivity._id}/${mondayFstToDo}`).set("Authorization", tokenUser)

        expect(resp.statusCode).toBe(200)
      })

      test("Should return a single object", async()=>{
        const {tokenUser, createdActivity} = await setUp()
        const mondayFstToDo = createdActivity.activities.mondays[0]

        const resp = await api.get(`${URI}/${createdActivity._id}/${mondayFstToDo}`).set("Authorization", tokenUser)

        expect(resp.body).toBeInstanceOf(Object)
      })
    })

    describe("When other user try to see the Todo", () => {
      test("Should return 400", async()=>{
        const {userNoMemberTk,  createdActivity} = await setUp()
        const mondayFstToDo = createdActivity.activities.mondays[0]

        const resp = await api.get(`${URI}/${createdActivity._id}/${mondayFstToDo}`).set("Authorization", userNoMemberTk)

        expect(resp.statusCode).toBe(400)
      })
    })
  })

  describe("POST /activity/:id/:todoID/done", () => {
    describe("When have token and valid ID", () => {
      test("Should return 200", async()=>{
        const {tokenUser, createdActivity} = await setUp()
        const mondayFstToDo = createdActivity.activities.mondays[0]

        const resp = await api.post(`${URI}/${createdActivity._id}/${mondayFstToDo}/done`).set("Authorization", tokenUser)

        expect(resp.statusCode).toBe(200)
      })

      test("Should change DONE atribute from a TODO", async()=>{
        const {tokenUser, createdActivity} = await setUp()
        const mondayFstToDo = createdActivity.activities.mondays[0]

        const todoBefore = await Todo.findById(mondayFstToDo)
        expect(todoBefore!.done).toBeFalsy()

        await api.post(`${URI}/${createdActivity._id}/${mondayFstToDo}/done`).set("Authorization", tokenUser)

        const todoAfter = await Todo.findById(mondayFstToDo)
        expect(todoAfter!.done).toBeTruthy()
      })

      test("Should change DONE atribute again from a TODO", async()=>{
        const {tokenUser, createdActivity} = await setUp()
        const mondayFstToDo = createdActivity.activities.mondays[0]

        //First Done
        await api.post(`${URI}/${createdActivity._id}/${mondayFstToDo}/done`).set("Authorization", tokenUser)

        const todoBefore = await Todo.findById(mondayFstToDo)
        expect(todoBefore!.done).toBeTruthy()
      
        //Done again
        await api.post(`${URI}/${createdActivity._id}/${mondayFstToDo}/done`).set("Authorization", tokenUser)

        const todoAfter = await Todo.findById(mondayFstToDo)
        expect(todoAfter!.done).toBeFalsy()

      })
    })

    describe("When other user try to see the Todo", () => {
      test("Should return 400", async()=>{
        const {userNoMemberTk, createdActivity} = await setUp()
        const mondayFstToDo = createdActivity.activities.mondays[0]

        const resp = await api.post(`${URI}/${createdActivity._id}/${mondayFstToDo}/done`).set("Authorization", userNoMemberTk)

        expect(resp.statusCode).toBe(400)
      })
    })
  })
})
