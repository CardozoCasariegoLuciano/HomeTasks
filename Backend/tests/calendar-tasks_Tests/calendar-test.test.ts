import { api, registerUser, userToRegister } from "../generic_helpers";
import mongoose from "mongoose";
import Calendar from "../../src/models/calendar.model";
import Invitation from "../../src/models/invitation.model";
import User from "../../src/models/user.model";
import Task from "../../src/models/task.model";
import { cases, URI } from "../calendar_Tests/utils";

afterAll(() => {
  mongoose.disconnect();
});

beforeEach(async () => {
  await Calendar.deleteMany({});
  await User.deleteMany({});
  await Invitation.deleteMany({});
  await Task.deleteMany({});
});

describe("/api/calendar", () => {
  const body = cases[0];

  describe("POST /:id/addtask", () => {
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
        const data = { title: "algoo" };

        const resp = await api
          .post(`${URI}/${calendaID}/addtask`)
          .send(data)
          .set("Authorization", userToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

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

        const resp = await api.post(`${URI}/${calendaID}/addtask`).send(data);

        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });

  describe("GET  /:id/tasks", () => {
    describe("When valid calendar ID and token", () => {
      test("Should respond 200", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        //Listing all tasks
        const resp = await api
          .get(`${URI}/${calendarID}/tasks`)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(200);
      });

      test("Should respond a object with an Array", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        //Listing allAfter
        const resp = await api
          .get(`${URI}/${calendarID}/tasks`)
          .set("Authorization", tokenFounder);
        expect(resp.body.Tasks).toBeInstanceOf(Array);
        expect(resp.body.Tasks).toHaveLength(0);
      });

      test("The array length should increase if add a new task", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        //Assertion
        const respA = await api
          .get(`${URI}/${calendarID}/tasks`)
          .set("Authorization", tokenFounder);
        expect(respA.body.Tasks).toHaveLength(0);

        //Adding a new task
        const data = {
          title: "Tarea 1",
          description: "Alta tarea loco",
          options: ["ropa", "baño"],
        };
        await api
          .post(`${URI}/${calendarID}/addtask`)
          .send(data)
          .set("Authorization", tokenFounder);

        //Listing allAfter
        const respB = await api
          .get(`${URI}/${calendarID}/tasks`)
          .set("Authorization", tokenFounder);
        expect(respB.body.Tasks).toHaveLength(1);
      });
    });

    describe("When calendar not found", () => {
      test("Should respond  400", async () => {
        const founderToken = await registerUser(userToRegister[0]);

        const badID = "627fd14ec7e3fc74cd9189ac";

        //Getting tasks
        const resp = await api
          .get(`${URI}/${badID}/tasks`)
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

        //Getting tasks
        const resp = await api
          .get(`${URI}/${badID}/tasks`)
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

        //Getting tasks
        const resp = await api
          .get(`${URI}/${calendaID}/tasks`)
          .set("Authorization", userToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When no token provided", () => {
      test("Should respond 400", async () => {
        const founderToken = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendaID = createdCalendar.body.Calendar._id;

        //Getting tasks
        const resp = await api.get(`${URI}/${calendaID}/tasks`);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });

  describe("GET  /:id/task/:id", () => {
    describe("When valid calendar and task ID and token", () => {
      test("Should respond 200", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        //Adding new tasks
        const data = {
          title: "titulo2",
          description: "descripcion2",
          options: ["baño", "Cocina"],
        };

        const task = await api
          .post(`${URI}/${calendarID}/addtask`)
          .send(data)
          .set("Authorization", tokenFounder);

        const taskID = task.body.Task._id;

        //Listing all tasks
        const resp = await api
          .get(`${URI}/${calendarID}/task/${taskID}`)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(200);
      });

      test("Should respond a single object", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        //Adding new tasks
        const data = {
          title: "titulo2",
          description: "descripcion2",
          options: ["baño", "Cocina"],
        };

        const task = await api
          .post(`${URI}/${calendarID}/addtask`)
          .send(data)
          .set("Authorization", tokenFounder);

        const taskID = task.body.Task._id;

        //Gettin task
        const resp = await api
          .get(`${URI}/${calendarID}/task/${taskID}`)
          .set("Authorization", tokenFounder);
        expect(resp.body).toBeInstanceOf(Object);
        expect(resp.body._id).toBeDefined();
      });

      test("The Object should have the rigth data ", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        //Adding a new task
        const data = {
          title: "Tarea 1",
          description: "Alta tarea loco",
          options: ["ropa", "baño"],
        };
        const task = await api
          .post(`${URI}/${calendarID}/addtask`)
          .send(data)
          .set("Authorization", tokenFounder);

        const taskID = task.body.Task._id;

        //Listing allAfter
        const respB = await api
          .get(`${URI}/${calendarID}/task/${taskID}`)
          .set("Authorization", tokenFounder);

        expect(respB.body.title).toBe(data.title);
        expect(respB.body.description).toBe(data.description);
        expect(respB.body.options).toStrictEqual(data.options);
        expect(respB.body._id).toBe(taskID);
      });
    });

    describe("When calendar not found", () => {
      test("Should respond  400", async () => {
        const founderToken = await registerUser(userToRegister[0]);

        const badID = "627fd14ec7e3fc74cd9189ac";

        //Getting tasks
        const resp = await api
          .get(`${URI}/${badID}/task/unIdrandom`)
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

        //Getting tasks
        const resp = await api
          .get(`${URI}/${badID}/task/unIdrandom`)
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

        //Adding a new task
        const data = {
          title: "Tarea 1",
          description: "Alta tarea loco",
          options: ["ropa", "baño"],
        };
        const task = await api
          .post(`${URI}/${calendaID}/addtask`)
          .send(data)
          .set("Authorization", founderToken);

        const taskID = task.body.Task._id;

        //Getting tasks
        const resp = await api
          .get(`${URI}/${calendaID}/task/${taskID}`)
          .set("Authorization", userToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When no token provided", () => {
      test("Should respond 400", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        //Adding a new task
        const data = {
          title: "Tarea 1",
          description: "Alta tarea loco",
          options: ["ropa", "baño"],
        };
        const task = await api
          .post(`${URI}/${calendarID}/addtask`)
          .send(data)
          .set("Authorization", tokenFounder);
        const taskID = task.body.Task._id;

        //Listing allAfter
        const resp = await api.get(`${URI}/${calendarID}/task/${taskID}`);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When task not found", () => {
      test("Should respond  400", async () => {
        const founderToken = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendarID = createdCalendar.body.Calendar._id;

        const badTaskID = "627fd14ec7e3fc74cd9189ac";

        //Getting tasks
        const resp = await api
          .get(`${URI}/${calendarID}/task/${badTaskID}`)
          .set("Authorization", founderToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Message).toBeDefined();
      });
    });

    describe("When no valid task ID", () => {
      test("Should respond  400", async () => {
        const founderToken = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendarID = createdCalendar.body.Calendar._id;

        const badTaskID = "NoValidID";

        //Getting tasks
        const resp = await api
          .get(`${URI}/${calendarID}/task/${badTaskID}`)
          .set("Authorization", founderToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Message).toBeDefined();
      });
    });
  });

  describe("DELETE /:id/task/:id", () => {
    describe("When valid calendar and task ID and have token", () => {
      test("Should return 200", async () => {
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

        //Creating a task
        const createdTask = await api
          .post(`${URI}/${calendaID}/addtask`)
          .send(data)
          .set("Authorization", tokenFounder);

        const taskID = createdTask.body.Task._id;

        //Deleting task
        const resp = await api
          .delete(`${URI}/${calendaID}/task/${taskID}`)
          .set("Authorization", tokenFounder);

        expect(resp.statusCode).toBe(200);
      });

      test("Should detele the task from calendar", async () => {
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

        //Creating a task
        const createdTask = await api
          .post(`${URI}/${calendaID}/addtask`)
          .send(data)
          .set("Authorization", tokenFounder);

        const taskID = createdTask.body.Task._id;

        //Assertion
        const calendarDB1 = await Calendar.findById(calendaID);
        expect(calendarDB1!.tasks).toHaveLength(1);

        //Deleting task
        const resp = await api
          .delete(`${URI}/${calendaID}/task/${taskID}`)
          .set("Authorization", tokenFounder);

        //Assertion
        const calendarDB2 = await Calendar.findById(calendaID);
        expect(calendarDB2!.tasks).toHaveLength(0);
      });

      test("Should detele the task from DB", async () => {
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

        //Creating a task
        const createdTask = await api
          .post(`${URI}/${calendaID}/addtask`)
          .send(data)
          .set("Authorization", tokenFounder);

        const taskID = createdTask.body.Task._id;

        //Assertion
        const taskA = await Task.findById(taskID);
        expect(taskA).not.toBeNull();

        //Deleting task
        await api
          .delete(`${URI}/${calendaID}/task/${taskID}`)
          .set("Authorization", tokenFounder);

        //Assertion
        const taskB = await Task.findById(taskID);
        expect(taskB).toBeNull();
      });
    });

    describe("When no valid calendar ID", () => {
      test("Should respond  400", async () => {
        const founderToken = await registerUser(userToRegister[0]);

        const badID = "NoValidID";

        //Deleting task
        const resp = await api
          .delete(`${URI}/${badID}/task/unIdrandom`)
          .set("Authorization", founderToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When calendar not found", () => {
      test("Should respond  400", async () => {
        const founderToken = await registerUser(userToRegister[0]);

        const badID = "627fd14ec7e3fc74cd9189ac";

        //Deleting task
        const resp = await api
          .delete(`${URI}/${badID}/task/unIdrandom`)
          .set("Authorization", founderToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Message).toBeDefined();
      });
    });

    describe("When no valid task ID", () => {
      test("Should respond  400", async () => {
        const founderToken = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendarID = createdCalendar.body.Calendar._id;

        const badTaskID = "627fd14ec7e3fc74cd9189ac";

        //Deleting task
        const resp = await api
          .delete(`${URI}/${calendarID}/task/${badTaskID}`)
          .set("Authorization", founderToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Message).toBeDefined();
      });
    });

    describe("When task not found", () => {
      test("Should respond  400", async () => {
        const founderToken = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendarID = createdCalendar.body.Calendar._id;

        const badTaskID = "627fd14ec7e3fc74cd9189ac";

        //Deleting task
        const resp = await api
          .delete(`${URI}/${calendarID}/task/${badTaskID}`)
          .set("Authorization", founderToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Message).toBeDefined();
      });
    });

    describe("When a regular user try to delete a task", () => {
      test("Should respond 400", async () => {
        const founderToken = await registerUser(userToRegister[0]);
        const userToken = await registerUser(userToRegister[1]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", founderToken);
        const calendaID = createdCalendar.body.Calendar._id;

        //Adding a new task
        const data = {
          title: "Tarea 1",
          description: "Alta tarea loco",
          options: ["ropa", "baño"],
        };
        const task = await api
          .post(`${URI}/${calendaID}/addtask`)
          .send(data)
          .set("Authorization", founderToken);

        const taskID = task.body.Task._id;

        //Deleting task
        const resp = await api
          .delete(`${URI}/${calendaID}/task/${taskID}`)
          .set("Authorization", userToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });

    describe("When no token is provided", () => {
      test("Should respond 400", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendarID = createdCalendar.body.Calendar._id;

        //Adding a new task
        const data = {
          title: "Tarea 1",
          description: "Alta tarea loco",
          options: ["ropa", "baño"],
        };
        const task = await api
          .post(`${URI}/${calendarID}/addtask`)
          .send(data)
          .set("Authorization", tokenFounder);
        const taskID = task.body.Task._id;

        //Deleting task
        const resp = await api.delete(`${URI}/${calendarID}/task/${taskID}`);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });

  describe("POST /:id/task/:id/option", () => {
    describe("When have token, valid data and IDs", () => {
      test("Should return 200", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendaID = createdCalendar.body.Calendar._id;

        //Create task
        const data = {
          title: "titulo",
          description: "descripcion",
        };

        const createdTask = await api
          .post(`${URI}/${calendaID}/addtask`)
          .send(data)
          .set("Authorization", tokenFounder);
        const taskID = createdTask.body.Task._id;

        //Addin an option
        const dataOption = { options: ["Baño", "Pisos", "Platos"] };
        const resp = await api
          .post(`${URI}/${calendaID}/task/${taskID}/option`)
          .send(dataOption)
          .set("Authorization", tokenFounder);

        expect(resp.statusCode).toBe(200);
      });

      test("Should add a new option into the task", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendaID = createdCalendar.body.Calendar._id;

        //Create task
        const data = {
          title: "titulo",
          description: "descripcion",
        };

        const createdTask = await api
          .post(`${URI}/${calendaID}/addtask`)
          .send(data)
          .set("Authorization", tokenFounder);
        const taskID = createdTask.body.Task._id;

        //Assertion
        const taskA = await Task.findById(taskID);
        expect(taskA!.options).toStrictEqual([]);

        //Adding an option
        const dataOption = {
          options: ["Baño", "Pisos", "Platos"],
        };
        await api
          .post(`${URI}/${calendaID}/task/${taskID}/option`)
          .send(dataOption)
          .set("Authorization", tokenFounder);

        //Assertion
        const taskB = await Task.findById(taskID);
        expect(taskB!.options).toStrictEqual(dataOption.options);
      });
    });

    describe("When has token, valid IDs but no valid Data", () => {
      test("Should respond 400 with no valid data", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendaID = createdCalendar.body.Calendar._id;

        // Creating a task
        const data = {
          title: "Tarea01",
        };

        const createdTask = await api
          .post(`${URI}/${calendaID}/addtask`)
          .send(data)
          .set("Authorization", tokenFounder);
        const taskID = createdTask.body.Task._id;

        //Adding an option
        const badDataOption = [
          {},
          { options: [123, 123123] },
          { options: ["bien", 123123] },
        ];

        for (let dataOption of badDataOption) {
          const resp = await api
            .post(`${URI}/${calendaID}/task/${taskID}/option`)
            .send(dataOption)
            .set("Authorization", tokenFounder);

          expect(resp.statusCode).toBe(400);
          expect(resp.body.Error).toBeDefined();
        }
      });
    });

    describe("When a regular user try to add an option", () => {
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
        const data = { title: "algoo" };

        const createdTask = await api
          .post(`${URI}/${calendaID}/addtask`)
          .send(data)
          .set("Authorization", founderToken);
        const taskID = createdTask.body.Task._id;

        //Adding options
        const dataOptions = {
          options: ["algo"],
        };
        const resp = await api
          .post(`${URI}/${calendaID}/task/${taskID}/option`)
          .send(dataOptions)
          .set("Authorization", userToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });

  describe("PUT /:id/task/:id/option", () => {
    describe("When have token, valid data and IDs", () => {
      test("Should return 200", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendaID = createdCalendar.body.Calendar._id;

        //Create task
        const data = {
          title: "titulo",
          description: "descripcion",
        };

        const createdTask = await api
          .post(`${URI}/${calendaID}/addtask`)
          .send(data)
          .set("Authorization", tokenFounder);
        const taskID = createdTask.body.Task._id;

        //Addin an option
        const dataOption = { options: ["Baño", "Pisos", "Platos"] };
        await api
          .post(`${URI}/${calendaID}/task/${taskID}/option`)
          .send(dataOption)
          .set("Authorization", tokenFounder);

        //Editing options
        const editOptionData = { options: ["Baño", "Pisos"] };
        const resp = await api
          .put(`${URI}/${calendaID}/task/${taskID}/option`)
          .send(editOptionData)
          .set("Authorization", tokenFounder);

        expect(resp.statusCode).toBe(200);
      });

      test("Should edit the options", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendaID = createdCalendar.body.Calendar._id;

        //Create task
        const data = {
          title: "titulo",
          description: "descripcion",
        };

        const createdTask = await api
          .post(`${URI}/${calendaID}/addtask`)
          .send(data)
          .set("Authorization", tokenFounder);
        const taskID = createdTask.body.Task._id;

        //Adding an option
        const dataOption = {
          options: ["Baño", "Pisos", "Platos"],
        };
        await api
          .post(`${URI}/${calendaID}/task/${taskID}/option`)
          .send(dataOption)
          .set("Authorization", tokenFounder);

        //Assertion
        const taskA = await Task.findById(taskID);
        expect(taskA!.options).toStrictEqual(dataOption.options);

        //editing options
        const editDataOptions = {
          options: ["Baño", "Platos"],
        };
        await api
          .put(`${URI}/${calendaID}/task/${taskID}/option`)
          .send(editDataOptions)
          .set("Authorization", tokenFounder);

        //Assertion
        const taskB = await Task.findById(taskID);
        expect(taskB!.options).toStrictEqual(editDataOptions.options);
      });
    });

    describe("When has token, valid IDs but no valid Data", () => {
      test("Should respond 400 with no valid data", async () => {
        const tokenFounder = await registerUser(userToRegister[0]);

        //Create calendar
        const createdCalendar = await api
          .post(URI)
          .send(body)
          .set("Authorization", tokenFounder);
        const calendaID = createdCalendar.body.Calendar._id;

        // Creating a task
        const data = {
          title: "Tarea01",
        };

        const createdTask = await api
          .post(`${URI}/${calendaID}/addtask`)
          .send(data)
          .set("Authorization", tokenFounder);
        const taskID = createdTask.body.Task._id;

        //Adding an option
        const dataOptions = { options: ["panchos"] };

        const resp = await api
          .post(`${URI}/${calendaID}/task/${taskID}/option`)
          .send(dataOptions)
          .set("Authorization", tokenFounder);

        //Editing options
        const badDataOptionEdit = [
          {},
          { options: [123, 123123] },
          { options: ["bien", 123123] },
        ];

        for (let dataOption of badDataOptionEdit) {
          const resp = await api
            .put(`${URI}/${calendaID}/task/${taskID}/option`)
            .send(dataOption)
            .set("Authorization", tokenFounder);

          expect(resp.statusCode).toBe(400);
          expect(resp.body.Error).toBeDefined();
        }
      });
    });

    describe("When a regular user try to add an option", () => {
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
        const data = { title: "algoo" };

        const createdTask = await api
          .post(`${URI}/${calendaID}/addtask`)
          .send(data)
          .set("Authorization", founderToken);
        const taskID = createdTask.body.Task._id;

        //Adding options
        const dataOptions = {
          options: ["algo"],
        };
        await api
          .post(`${URI}/${calendaID}/task/${taskID}/option`)
          .send(dataOptions)
          .set("Authorization", founderToken);

        //Editing options
        const editDataOptions = {
          options: [],
        };
        const resp = await api
          .put(`${URI}/${calendaID}/task/${taskID}/option`)
          .send(dataOptions)
          .set("Authorization", userToken);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });
});
