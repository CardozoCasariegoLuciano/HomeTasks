import { api, registerUser, userToRegister} from "../generic_helpers";
import mongoose from "mongoose";
import Calendar from "../../src/models/calendar.model";
import Invitation from "../../src/models/invitation.model";
import User from "../../src/models/user.model";
import Todo from "../../src/models/tasktoDo.model";
import { URI, setUp } from "./utils";

afterAll(() => {
  mongoose.disconnect();
});

beforeEach(async () => {
  await Calendar.deleteMany({});
  await User.deleteMany({});
  await Invitation.deleteMany({});
  await Todo.deleteMany({})
});

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
        const userToken = await registerUser(userToRegister[2])
        const resp = await api.get(URI).set("Authorization", userToken)

        expect(resp.body).toBeInstanceOf(Array)
        expect(resp.body).toHaveLength(0)
      })
    })
  })

  describe("GET /calendar/:id", () => {

    describe("When have token and valid ID", () => {
      test("Should return 200", async()=>{
        const {tokenUser, calendarID} = await setUp()
        const resp = await api.get(`${URI}/calendar/${calendarID}`).set("Authorization", tokenUser)

        expect(resp.statusCode).toBe(200)
      })

      test("Should return a list", async()=>{
        //const {tokenUser} = await setUp()
        //const resp = await api.get(URI).set("Authorization", tokenUser)

        //expect(resp.body).toBeInstanceOf(Array)
      })

      test("todos los id tienen que ser igual al calendario pasado por params", async()=>{
      })
    })
  })
})
