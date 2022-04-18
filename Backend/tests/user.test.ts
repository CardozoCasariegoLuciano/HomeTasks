import { api, userToRegister, registerUser, setUp } from "./generic_helpers";
import User from "../src/models/user.model";
import mongoose from "mongoose";


afterAll(() => {
  mongoose.disconnect();
});

beforeEach(async () => {
  await User.deleteMany({});
});

const URI = "/api/user";


describe("/api/user", () => {
  describe("GET /", () => {
    test("Must respond a 200 status code", async()=>{
      const resp = await api.get(URI)
      expect(resp.statusCode).toBe(200)
    })

    test("Must respond an array", async()=>{
      const resp = await api.get(URI)
      expect(resp.body).toBeInstanceOf(Array)
    })

    test("The return array must increase if a new user was registered", async()=>{
      const resp = await api.get(URI)
      expect(resp.body).toHaveLength(0)

      await registerUser(userToRegister[0])
      const respAfeterRegister = await api.get(URI)
      expect(respAfeterRegister.body).toHaveLength(1)
    })
  })

  describe("GET /:id", () => {
    describe("When a valid ID is sended", () => {

      test("Must respond a 200 status code", async()=>{
        const {userID} = await setUp()

        const resp = await api.get(URI+ "/" + userID)

        expect(resp.statusCode).toBe(200)
      })

      test("Must respond a single object", async()=>{
        const {userID} = await setUp()

        const resp = await api.get(URI+ "/" + userID)

        expect(resp.body).toBeInstanceOf(Object)
        expect(resp.body).not.toBeInstanceOf(Array)
      })

      test("Must respond the user data", async()=>{
        const {userID} = await setUp()

        const resp = await api.get(URI+ "/" + userID)

        expect(resp.body.name).toBeDefined()
        expect(resp.body.email).toBeDefined()
        expect(resp.body._id).toBeDefined()
        expect(resp.body.calendars).toBeDefined()
        expect(resp.body.invitations).toBeDefined()
      })
    }) 
  })

  describe("POST /:id/rename", () => {
    describe("When a valid data is sended, and has token", () => {
      const newName = {name: "Rodolfo"}

      test("Must respond a 200 status code", async()=>{
        const token =  await registerUser(userToRegister[0])
        const resp = await api.post(URI + "/rename").send(newName).set("Authorization", token)
        expect(resp.statusCode).toBe(200)
      })

      test("Must respond with a Message", async()=>{
        const token =  await registerUser(userToRegister[0])
        const resp = await api.post(URI  + "/rename").send(newName).set("Authorization", token)
        expect(resp.body.Message).toBe("Name successfully changed")
      })

      test("The user name must change", async()=>{
        const {userID, tokenUser} = await setUp()

        const userFound = await api.get(URI + "/" + userID)
        expect(userFound.body.name).toBe("paula")

        await api.post(URI + "/rename").send(newName).set("Authorization", tokenUser)

        const userNameChanged = await api.get(URI + "/" + userID)
        expect(userNameChanged.body.name).toBe("rodolfo")
      })
    })

    describe("When a name is not sended", () => {
      test("Must respond a 400 status code", async()=>{
        const token =  await registerUser(userToRegister[0])
        const resp = await api.post(URI  + "/rename").send().set("Authorization", token)
        expect(resp.statusCode).toBe(400)
        expect(resp.body.Error).toBeDefined()
      })

      test("The user name must not change", async()=>{
        const {userID, tokenUser} = await setUp()

        const userFound = await api.get(URI + "/" + userID)
        expect(userFound.body.name).toBe("paula")

        await api.post(URI + "/rename").send().set("Authorization", tokenUser)

        const userNameChanged = await api.get(URI + "/" + userID)
        expect(userNameChanged.body.name).toBe("paula")
      })
    })
  })
});