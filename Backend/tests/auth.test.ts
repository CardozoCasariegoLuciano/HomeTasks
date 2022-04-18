import { api, userToLogin, userToRegister } from "./generic_helpers";
import mongoose from "mongoose";
import User from "../src/models/user.model";

const registerURI = "/api/auth/register"
const loginURI = "/api/auth/login"

afterAll(() => {
  mongoose.disconnect();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe("/api/auth", () => {
  describe("/register", () => { 
     describe("When all data is Ok", () => {
      test("Must respond with 200 status code", async () => {
        const resp = await api.post(registerURI).send(userToRegister[0]);
        expect(resp.statusCode).toBe(200);
      });

      test("Must return an object with the JWT", async () => {
        const resp = await api.post(registerURI).send(userToRegister[0]);

        expect(resp.body.token).toBeDefined();
        expect(typeof resp.body.token).toBe("string");
      });

      test("Must add the new user into de DB", async () => {
        await api.post(registerURI).send(userToRegister[0]);
        const usuarios = await User.find();

        expect(usuarios).toHaveLength(1);
      });
    });

    describe("When some data is not Ok", () => {
      const badCases = [
        {
          //password dont match
          name: "Lucas",
          email: "123lucas@gmail.com",
          password: "123123",
          repited_password: "123",
        },
        {
          //Missing field
          name: "Lucas",
          email: "123lucas@gmail.com",
          repited_password: "123",
        },
        {
          //invalid email
          name: "Lucas",
          email: "123lucasail.com",
          password: "123123",
          repited_password: "123",
        },
      ];

      test("Must respond a 400 status code", async () => {
        for (let data of badCases) {
          const resp = await api.post(registerURI).send(data);
          expect(resp.statusCode).toBe(400);
        }
      });
      
      test("If the mail was taken Must respond a 400 statusCode, a Messaje and type 'MAIL_TAKEN'", async () => {
        await api.post(registerURI).send(userToRegister[0]);
        const resp = await api.post(registerURI).send(userToRegister[0]);

        expect(resp.statusCode).toBe(400);
        expect(resp.body.Message).toBe("That email was already taken");
      });

      test("Mustnt add a new user into de DB", async () => {
        const database = await User.find();

        for (let data of badCases) {
          await api.post(registerURI).send(data);
          expect(database).toHaveLength(0);
        }
      });
    });
  });

  describe("/login", () => {  
    describe("When all data is Ok", () => {
      test("Must respond witd 200 status code", async () => {registerURI
        //Register a user
        await api.post(registerURI).send(userToRegister[0]);

        //Login a user
        const resp = await api.post(loginURI).send(userToLogin[0]);
        expect(resp.statusCode).toBe(200);
      });

      test("Must respond with a token in a object", async () => {
        //Register a user
        await api.post(registerURI).send(userToRegister[0]);

        //Login a user
        const resp = await api.post(loginURI).send(userToLogin[0]);

        expect(resp.body.token).toBeDefined();
        expect(typeof resp.body.token).toBe("string");
      });
    });

    describe("When some data is not Ok", () => {
      test("Must respond witd status 400", async () => {       
        //Register a user
        await api.post(registerURI).send(userToRegister[0]);

        //Login a user
        const resp = await api.post(loginURI).send(userToLogin[1]);

        expect(resp.statusCode).toBe(400);   
        expect(resp.body.Messaje).toBe("Wrong email or password");
      });
    });
  });
});
