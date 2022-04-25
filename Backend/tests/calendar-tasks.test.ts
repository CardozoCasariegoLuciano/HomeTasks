import { api, registerUser, userToRegister, setUp } from "./generic_helpers";
import mongoose from "mongoose";
import Calendar from "../src/models/calendar.model";
import Invitation from "../src/models/invitation.model";
import User from "../src/models/user.model";
import Task from "../src/models/task.model";
export const URI = "/api/calendar";

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

  describe("POST /:id/addtask", () => {
    describe("When has token, valid calendar ID and valid Data", () => {
      test("Should respond 200", async () => {
        const {tokenFounder, calendarID} = await setUp()       

        //Adding task
        const data = {title: "titulo"};

        const resp = await api
          .post(`${URI}/${calendarID}/addtask`)
          .send(data)
          .set("Authorization", tokenFounder);
        
        //Assertion
        expect(resp.statusCode).toBe(200);
      });

      test("should add a new element on Calendar tasks list", async () => {
        const {tokenFounder, calendarID, createdCalendar } = await setUp() 

        //data for tasks
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
        //Adding new tasks
        for (let dataCase of data) {
          await api
            .post(`${URI}/${calendarID}/addtask`)
            .send(dataCase)
            .set("Authorization", tokenFounder);
        }

        //assertion
        const resp = await Calendar.findById(calendarID);
        //desde el setUp ya viene con una tarea agregada
        expect(resp!.tasks).toHaveLength(data.length + 1);
      });
    });

    describe("When has token, valid Calendar ID but no valid Data", () => {
      test("Should respond 400 with no valid data", async () => {
        const {tokenFounder, calendarID} = await setUp()  

        //Bad data for tasks
        const dataCases = [
          { title: 123123 },
          {},
          {
            title: "Valid",
            options: [123, 32123],
          },
          { title: "Valed", description: 12312313 },
        ];

        // Creating a task with wrong data
        for (let data of dataCases) {
          const resp = await api
            .post(`${URI}/${calendarID}/addtask`)
            .send(data)
            .set("Authorization", tokenFounder);

          //Assertion
          expect(resp.statusCode).toBe(400);
        }
      });
    });

    describe("When a regular user try to add a task", () => {
      test("Should respond 400", async () => {
        const {calendarID, userNoMemberTk} = await setUp()

        //data tasks
        const data = { title: "algoo" };

        //Creating a tasks
        const resp = await api
          .post(`${URI}/${calendarID}/addtask`)
          .send(data)
          .set("Authorization", userNoMemberTk);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });

  describe("GET  /:id/tasks", () => {
    describe("When valid calendar ID and token", () => {
      test("Should respond 200", async () => {
       const {calendarID, tokenFounder} = await setUp()

        //Listing all tasks
        const resp = await api
          .get(`${URI}/${calendarID}/tasks`)
          .set("Authorization", tokenFounder);
        //Assertion
        expect(resp.statusCode).toBe(200);
      });

      test("Should respond a object with an Array", async () => {
        const {calendarID, tokenFounder} = await setUp()

        //Listing all tasks
        const resp = await api
          .get(`${URI}/${calendarID}/tasks`)
          .set("Authorization", tokenFounder);          
        //Assertion
        expect(resp.body.Tasks).toBeInstanceOf(Array);
        //desde el setUp ya viene con una tarea
        expect(resp.body.Tasks).toHaveLength(1);
      });

      test("The array length should increase if add a new task", async () => {
        const {calendarID, tokenFounder} = await setUp()

        //Assertion
        const respA = await api
          .get(`${URI}/${calendarID}/tasks`)
          .set("Authorization", tokenFounder);
          //desde el SetUp ya viene con una tarea
        expect(respA.body.Tasks).toHaveLength(1);

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

        //Listing all
        const respB = await api
          .get(`${URI}/${calendarID}/tasks`)
          .set("Authorization", tokenFounder);
        //Assertion
        expect(respB.body.Tasks).toHaveLength(2);
      });
    });

    describe("When a regular user is loged", () => {
      test("Should respond 400", async () => {
        const {calendarID, tokenUser} = await setUp()

        //Getting tasks
        const resp = await api
          .get(`${URI}/${calendarID}/tasks`)
          .set("Authorization", tokenUser);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });

  describe("GET  /:id/task/:id", () => {
    describe("When valid calendar and task ID and token", () => {
      test("Should respond 200", async () => {
        const {calendarID, tokenFounder, taskID} = await setUp()        

        //Listing all tasks
        const resp = await api
          .get(`${URI}/${calendarID}/task/${taskID}`)
          .set("Authorization", tokenFounder);
        expect(resp.statusCode).toBe(200);
      });

      test("Should respond a single object", async () => {
        const {calendarID, tokenFounder, taskID} = await setUp() 

        //Gettin task
        const resp = await api
          .get(`${URI}/${calendarID}/task/${taskID}`)
          .set("Authorization", tokenFounder);
        expect(resp.body).toBeInstanceOf(Object);
        expect(resp.body._id).toBeDefined();
      });

      test("The Object should have the rigth fields ", async () => {
        const {calendarID, tokenFounder, taskID} = await setUp() 

        //Listing allAfter
        const resp = await api
          .get(`${URI}/${calendarID}/task/${taskID}`)
          .set("Authorization", tokenFounder);

        expect(resp.body.title).toBeDefined()
        expect(resp.body.description).toBeDefined()
        expect(resp.body.options).toBeDefined()
        expect(resp.body._id).toBe(taskID);
      });
    });

    describe("When a regular user is loged", () => {
      test("Should respond 400", async () => {
        const {calendarID, userNoMemberTk, taskID} = await setUp() 

        //Getting tasks
        const resp = await api
          .get(`${URI}/${calendarID}/task/${taskID}`)
          .set("Authorization", userNoMemberTk);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });

  describe("DELETE /:id/task/:id", () => {
    describe("When valid calendar and task ID and have token", () => {
      test("Should return 200", async () => {
        const {calendarID, tokenFounder, taskID} = await setUp() 

        //Deleting task
        const resp = await api
          .delete(`${URI}/${calendarID}/task/${taskID}`)
          .set("Authorization", tokenFounder);

        expect(resp.statusCode).toBe(200);
      });

      test("Should detele the task from calendar", async () => {
        const {calendarID, tokenFounder, taskID} = await setUp()

        //Assertion
        const calendarDB1 = await Calendar.findById(calendarID);
        expect(calendarDB1!.tasks).toHaveLength(1);

        //Deleting task
        const resp = await api
          .delete(`${URI}/${calendarID}/task/${taskID}`)
          .set("Authorization", tokenFounder);

        //Assertion
        const calendarDB2 = await Calendar.findById(calendarID);
        expect(calendarDB2!.tasks).toHaveLength(0);
      });

      test("Should detele the task from DB", async () => {
        const {calendarID, tokenFounder, taskID} = await setUp()

        //Assertion
        const taskA = await Task.findById(taskID);
        expect(taskA).not.toBeNull();

        //Deleting task
        await api
          .delete(`${URI}/${calendarID}/task/${taskID}`)
          .set("Authorization", tokenFounder);

        //Assertion
        const taskB = await Task.findById(taskID);
        expect(taskB).toBeNull();
      });
    });

    describe("When a regular user try to delete a task", () => {
      test("Should respond 400", async () => {
        const {calendarID, userNoMemberTk, taskID} = await setUp()

        //Deleting task
        const resp = await api
          .delete(`${URI}/${calendarID}/task/${taskID}`)
          .set("Authorization", userNoMemberTk);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });

  describe("POST /:id/task/:id/option", () => {
    describe("When have token, valid data and IDs", () => {
      test("Should return 200", async () => {
        const {calendarID, tokenFounder, taskID} = await setUp()

        //Addin an option
        const dataOption = { options: ["Baño", "Pisos", "Platos"] };
        const resp = await api
          .post(`${URI}/${calendarID}/task/${taskID}/option`)
          .send(dataOption)
          .set("Authorization", tokenFounder);

        //Assertion
        expect(resp.statusCode).toBe(200);
      });

      test("Should add a new option into the task", async () => {
        const {calendarID, tokenFounder, taskID} = await setUp()

        //Assertion
        const taskA = await Task.findById(taskID);
        expect(taskA!.options).toStrictEqual([]);

        //Adding an option
        const dataOption = {
          options: ["Baño", "Pisos", "Platos"],
        };
        await api
          .post(`${URI}/${calendarID}/task/${taskID}/option`)
          .send(dataOption)
          .set("Authorization", tokenFounder);

        //Assertion
        const taskB = await Task.findById(taskID);
        expect(taskB!.options).toStrictEqual(dataOption.options);
      });
    });

    describe("When has token, valid IDs but no valid Data", () => {
      test("Should respond 400 with no valid data", async () => {
        const {calendarID, tokenFounder, taskID} = await setUp()

        //Adding an option
        const badDataOption = [
          {},
          { options: [123, 123123] },
          { options: ["bien", 123123] },
        ];

        for (let dataOption of badDataOption) {
          const resp = await api
            .post(`${URI}/${calendarID}/task/${taskID}/option`)
            .send(dataOption)
            .set("Authorization", tokenFounder);

          expect(resp.statusCode).toBe(400);
          expect(resp.body.Error).toBeDefined();
        }
      });
    });

    describe("When a regular user try to add an option", () => {
      test("Should respond 400", async () => {
        const {calendarID, userNoMemberTk, taskID} = await setUp()

        //Adding options
        const dataOptions = {
          options: ["algo"],
        };
        const resp = await api
          .post(`${URI}/${calendarID}/task/${taskID}/option`)
          .send(dataOptions)
          .set("Authorization", userNoMemberTk);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });

  describe("PUT /:id/task/:id/option", () => {
    describe("When have token, valid data and IDs", () => {
      test("Should return 200", async () => {
        const {calendarID, tokenFounder, taskID} = await setUp()

        //Addin an option
        const dataOption = { options: ["Baño", "Pisos", "Platos"] };
        await api
          .post(`${URI}/${calendarID}/task/${taskID}/option`)
          .send(dataOption)
          .set("Authorization", tokenFounder);

        //Editing options
        const editOptionData = { options: ["Baño", "Pisos"] };
        const resp = await api
          .put(`${URI}/${calendarID}/task/${taskID}/option`)
          .send(editOptionData)
          .set("Authorization", tokenFounder);

        //Assertion
        expect(resp.statusCode).toBe(200);
      });

      test("Should edit the options", async () => {
        const {calendarID, tokenFounder, taskID} = await setUp()

        //Adding an option
        const dataOption = {
          options: ["Baño", "Pisos", "Platos"],
        };
        await api
          .post(`${URI}/${calendarID}/task/${taskID}/option`)
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
          .put(`${URI}/${calendarID}/task/${taskID}/option`)
          .send(editDataOptions)
          .set("Authorization", tokenFounder);

        //Assertion
        const taskB = await Task.findById(taskID);
        expect(taskB!.options).toStrictEqual(editDataOptions.options);
      });
    });

    describe("When has token, valid IDs but no valid Data", () => {
      test("Should respond 400 with no valid data", async () => {
        const {calendarID, tokenFounder, taskID} = await setUp()

        //Adding an option
        const dataOptions = { options: ["panchos"] };
        await api
          .post(`${URI}/${calendarID}/task/${taskID}/option`)
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
            .put(`${URI}/${calendarID}/task/${taskID}/option`)
            .send(dataOption)
            .set("Authorization", tokenFounder);

          //Assertion
          expect(resp.statusCode).toBe(400);
          expect(resp.body.Error).toBeDefined();
        }
      });
    });

    describe("When a regular user try to add an option", () => {
      test("Should respond 400", async () => {
        const {calendarID, userNoMemberTk, taskID} = await setUp()

        //Adding options
        const dataOptions = {
          options: ["algo"],
        };
        await api
          .post(`${URI}/${calendarID}/task/${taskID}/option`)
          .send(dataOptions)
          .set("Authorization", userNoMemberTk);

        //Editing options
        const editDataOptions = {
          options: [],
        };
        const resp = await api
          .put(`${URI}/${calendarID}/task/${taskID}/option`)
          .send(dataOptions)
          .set("Authorization", userNoMemberTk);

        //Assertion
        expect(resp.statusCode).toBe(400);
        expect(resp.body.Error).toBeDefined();
      });
    });
  });

});
