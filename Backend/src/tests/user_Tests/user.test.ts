import { api } from "../generic_helpers";
import User from "../../models/user.model";
import { user01,user02, registerUser, URI, addUser } from "./utils";
import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import {config} from "../../config";
import {JwtPayload} from "../../interfaces/token_interfaces";

afterAll(() => {
  mongoose.disconnect();
});

beforeEach(async () => {
  await User.deleteMany({});
});


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

      await registerUser(user01)
      const respAfeterRegister = await api.get(URI)
      expect(respAfeterRegister.body).toHaveLength(1)
    })
  })

  describe("GET /:id", () => {
    describe("When a valid ID is sended", () => {

      test("Must respond a 200 status code", async()=>{
        const user =  await addUser(user01)
        const id = user._id

        const resp = await api.get(URI+ "/" + id)

        expect(resp.statusCode).toBe(200)
      })

      test("Must respond a single object", async()=>{
        const user =  await addUser(user01)
        const id = user._id

        const resp = await api.get(URI+ "/" + id)

        expect(resp.body).toBeInstanceOf(Object)
        expect(resp.body).not.toBeInstanceOf(Array)
      })


      test("Must respond the user data", async()=>{
        const user =  await addUser(user01)
        const id = user._id

        const resp = await api.get(URI+ "/" + id)

        const expected = {
          name: user01.name.toLowerCase(),
          email: user01.email.toLowerCase(),
          invitations: [],
          calendars: [],
          _id: id
        }

        expect(resp.body).toMatchObject(expected)
      })
    })

    describe("When a invalid ID is sended", () => {

      test("Must respond a 400 status code", async()=>{
        const id = "asdj1k23hsdajfjassd"
        const resp = await api.get(URI+ "/" + id)

        expect(resp.statusCode).toBe(400)
      })

      test("Must show a message and an Error", async()=>{
        const id = "asdj1k23hsdajfjassd"
        const resp = await api.get(URI+ "/" + id)

        expect(resp.body.Error).toBeDefined()
        expect(resp.body.Message).toBe("Something went wrong")
      })
    })

    describe("When a valid ID is sended, but the user does not exist", () => {
      
      const validID = "61101eb557b690d4522452f5"

      test("Must respond a 400 status code", async()=>{
        const resp = await api.get(URI+ "/" + validID)
        expect(resp.statusCode).toBe(400)
      })

      test("Must show a message and an Error", async()=>{
        const resp = await api.get(URI+ "/" + validID)
        expect(resp.body.Message).toBe("User not found")
      })
    })

  })

  //describe("DELETE /:id", () => {

    //describe("When a valid ID is sended and has token", () => {
      {/* TODO: must respond 200 statuscode sáb 19 feb 2022 01:54:24  */}
      {/* TODO: mist respond a single object sáb 19 feb 2022 01:54:35  */}
      {/* TODO: the user mustnt be in the database sáb 19 feb 2022 01:54:53  */}
    //})

    //describe("When a invalid ID is sended", () => {
      {/* TODO: must respond 400 statuscode sáb 19 feb 2022 01:54:24  */}
      {/* TODO: mist respond with a messaje sáb 19 feb 2022 01:54:35  */}
      {/* TODO: the user must still being in the database sáb 19 feb 2022 01:54:53  */}
    //})

    //describe("When token is invalid or not sended", () => {
      {/* TODO: must respond 400 statuscode sáb 19 feb 2022 01:54:24  */}
      {/* TODO: mist respond with a messaje sáb 19 feb 2022 01:54:35  */}
      {/* TODO: the user must still being in the database sáb 19 feb 2022 01:54:53  */}
    //})

  //})

  describe("POST /:id/rename", () => {

    describe("When a valid data is sended, and has token", () => {

      const newName = {name: "Rodolfo"}

      test("Must respond a 200 status code", async()=>{
        const token =  await registerUser(user01)
        const data =  jwt.verify(token, config.TOKEN_KEY) as JwtPayload

        const resp = await api.post(URI + "/" + data._id + "/rename").send(newName).set("Authorization", token)

        expect(resp.statusCode).toBe(200)
      })

      test("Must respond with a Message", async()=>{
        const token =  await registerUser(user01)
        const data =  jwt.verify(token, config.TOKEN_KEY) as JwtPayload

        const resp = await api.post(URI + "/" + data._id + "/rename").send(newName).set("Authorization", token)

        expect(resp.body.Message).toBe("Name successfully changed")
      })


      test("The user name must change", async()=>{
        const token =  await registerUser(user01)
        const data =  jwt.verify(token, config.TOKEN_KEY) as JwtPayload

        const userFound = await api.get(URI + "/" + data._id)
        expect(userFound.body.name).toBe("pepe")

        await api.post(URI + "/" + data._id + "/rename").send(newName).set("Authorization", token)

        const userNameChanged = await api.get(URI + "/" + data._id)
        expect(userNameChanged.body.name).toBe("rodolfo")
      })
    })

    describe("When a name is not sended", () => {
      test("Must respond a 400 status code", async()=>{
        const token =  await registerUser(user01)
        const data =  jwt.verify(token, config.TOKEN_KEY) as JwtPayload

        const resp = await api.post(URI + "/" + data._id + "/rename").send().set("Authorization", token)

        expect(resp.statusCode).toBe(400)
      })

      test("Must respond with a Message and an Error", async()=>{
        const token =  await registerUser(user01)
        const data =  jwt.verify(token, config.TOKEN_KEY) as JwtPayload

        const resp = await api.post(URI + "/" + data._id + "/rename").send().set("Authorization", token)

        expect(resp.body.Message).toBe("Something went wrong")
        expect(resp.body.Error).toBeDefined()
      })

      test("The user name must not change", async()=>{
        const token =  await registerUser(user01)
        const data =  jwt.verify(token, config.TOKEN_KEY) as JwtPayload

        const userFound = await api.get(URI + "/" + data._id)
        expect(userFound.body.name).toBe("pepe")

        await api.post(URI + "/" + data._id + "/rename").send().set("Authorization", token)

        const userNameChanged = await api.get(URI + "/" + data._id)
        expect(userNameChanged.body.name).toBe("pepe")
      })

    })

    describe("When token is not sended", () => {

      const newName = {name: "Rogelio"}

      test("Must respond a 400 status code", async()=>{
        const token =  await registerUser(user01)
        const data =  jwt.verify(token, config.TOKEN_KEY) as JwtPayload

        //token is not sended in the request
        const resp = await api.post(URI + "/" + data._id + "/rename").send(newName)

        expect(resp.statusCode).toBe(400)
      })


      test("Must respond with a Message and an Error", async()=>{
        const token =  await registerUser(user01)
        const data =  jwt.verify(token, config.TOKEN_KEY) as JwtPayload

        //token is not sended in the request
        const resp = await api.post(URI + "/" + data._id + "/rename").send(newName)

        expect(resp.body.Error).toBe("No token provider")
      })

      test("The user name must not change", async()=>{
        const token =  await registerUser(user01)
        const data =  jwt.verify(token, config.TOKEN_KEY) as JwtPayload

        const userFound = await api.get(URI + "/" + data._id)
        expect(userFound.body.name).toBe("pepe")

        //token is not sended in the request
        await api.post(URI + "/" + data._id + "/rename").send(newName)

        const userNameChanged = await api.get(URI + "/" + data._id)
        expect(userNameChanged.body.name).toBe("pepe")
      })

    })

    describe("When try to change other user's name", () => {

      const newName = {name: "Ivan"}

      test("Must respond a 400 status code", async()=>{
        const user01_token =  await registerUser(user01)
        const user01_data =  jwt.verify(user01_token, config.TOKEN_KEY) as JwtPayload
        const user01_id = user01_data._id

        const user02_token =  await registerUser(user02)

        const resp = await api.post(URI + "/" + user01_id + "/rename").send(newName).set("Authorization", user02_token)

        expect(resp.statusCode).toBe(400)
      })

      test("Must respond an Error", async()=>{
        const user01_token =  await registerUser(user01)
        const user01_data =  jwt.verify(user01_token, config.TOKEN_KEY) as JwtPayload
        const user01_id = user01_data._id

        const user02_token =  await registerUser(user02)

        const resp = await api.post(URI + "/" + user01_id + "/rename").send(newName).set("Authorization", user02_token)

        expect(resp.body.Error).toBe("You just can change your name")
      })

      test("The user name must not change", async()=>{
        const user01_token =  await registerUser(user01)
        const user01_data =  jwt.verify(user01_token, config.TOKEN_KEY) as JwtPayload
        const user01_id = user01_data._id

        const user02_token =  await registerUser(user02)

        const userFound = await api.get(URI + "/" + user01_id)
        expect(userFound.body.name).toBe("pepe")

        await api.post(URI + "/" + user01_id + "/rename").send(newName).set("Authorization", user02_token)

        const userNameChanged = await api.get(URI + "/" + user01_id)
        expect(userNameChanged.body.name).toBe("pepe")
      })
    })

  })
});
