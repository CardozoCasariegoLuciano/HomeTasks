import { api } from "../generic_helpers";
import {register_initialState} from "./utils"
import mongoose from "mongoose";
import User from "../../src/models/user.model";

afterAll(() => {
  mongoose.disconnect();
});

beforeEach(async () => {
  await User.deleteMany({});

  for (let user of register_initialState) {
    await api.post("/api/auth/register").send(user);
  }
});

describe("/api/auth", () => {
  describe("/register", () => {
    const URI = "/api/auth/register";

    const aUser = {
      name: "Pepe",
      email: "123luciano@gmail.com",
      password: "123123",
      repited_password: "123123",
    };

    describe("When all data is Ok", () => {
      test("Must respond with 200 status code", async () => {
        const resp = await api.post(URI).send(aUser);
        expect(resp.statusCode).toBe(200);
      });

      test("Must return an object with the JWT", async () => {
        const resp = await api.post(URI).send(aUser);

        expect(resp.body.token).toBeDefined();
        expect(typeof resp.body.token).toBe("string");
      });

      test("Must add the new user into de DB", async () => {
        await api.post(URI).send(aUser);
        const usuarios = await User.find();

        expect(usuarios).toHaveLength(register_initialState.length + 1);
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
          const resp = await api.post(URI).send(data);
          expect(resp.statusCode).toBe(400);
        }
      });

      test("Must respond with a Messaje and an Error", async () => {
        for (let data of badCases) {
          const resp = await api.post(URI).send(data);
          expect(resp.body.Messaje).toBe("Something went wrong");
          expect(resp.body.Error.details).toBeDefined();
        }
      });

      test("If the mail was taken Must respond a 400 statusCode, a Messaje and type 'MAIL_TAKEN'", async () => {
        await api.post(URI).send(aUser);
        const resp = await api.post(URI).send(aUser);

        expect(resp.statusCode).toBe(400);
        expect(resp.body.Message).toBe("That email was already taken");
      });

      test("Mustnt add a new user into de DB", async () => {
        const database = await User.find();

        for (let data of badCases) {
          await api.post(URI).send(data);
          expect(database).toHaveLength(register_initialState.length);
        }
      });
    });
  });

  describe("/login", () => {
    const URI = "/api/auth/login";

    const Ulogin = {
      //exist in Register_InitialState
      email: "Sandra@gmail.com",
      password: "123123",
    };

    const Badlogin = [
      {
        //No exist in DB
        email: "Sandrooo@gmail.com",
        password: "123123",
      },
      {
        //Wrong password
        email: "Sandra@gmail.com",
        password: "nananana",
      },
    ];

    const badEmail = {
      email: "Sandrooo",
      password: "123123",
    };

    describe("When all data is Ok", () => {
      test("Must respond witd 200 status code", async () => {
        const resp = await api.post(URI).send(Ulogin);
        expect(resp.statusCode).toBe(200);
      });

      test("Must respond with a token in a object", async () => {
        const resp = await api.post(URI).send(Ulogin);

        expect(resp.body.token).toBeDefined();
        expect(typeof resp.body.token).toBe("string");
      });
    });

    describe("When some data is not Ok", () => {
      test("Must respond witd status 400", async () => {
        for (let data of Badlogin) {
          const resp = await api.post(URI).send(data);
          expect(resp.statusCode).toBe(400);
        }
      });

      test("Must respond with a Messaje and an Error", async () => {
        for (let data of Badlogin) {
          const resp = await api.post(URI).send(data);
          expect(resp.body.Messaje).toBe("Wrong email or password");
        }

        const resp = await api.post(URI).send(badEmail);
        expect(resp.body.Messaje).toBe("Something went wrong");
        expect(resp.body.Error).toBeDefined();
      });
    });
  });
});
