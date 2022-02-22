import { api, registerUser, user01R, user02R} from "../generic_helpers";
import mongoose from "mongoose";
import Calendar from "../../src/models/calendar.model"
import User from "../../src/models/user.model"
import { badCases, cases, URI} from "./utils";

afterAll(() => {
    mongoose.disconnect()
})

beforeEach(async () => {
    await Calendar.deleteMany({})
    await User.deleteMany({})
})

describe("/api/calendar", () => {
    describe("GET /:id", () => {
        describe("When has token, valid ID and is part of the calendar", () => {

            const body = cases[0]

            test("Should respond 200", async()=>{
                const token = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", token)

                const calendarID = createdCalendar.body.Calendar._id
                const resp = await api.get(`${URI}/${calendarID}`).set("Authorization", token)
                expect(resp.statusCode).toBe(200)
            })

            test("Should respond a calendar", async()=>{
                const token = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", token)

                const calendarID = createdCalendar.body.Calendar._id
                const resp = await api.get(`${URI}/${calendarID}`).set("Authorization", token)
                expect(resp.body).toBeInstanceOf(Object)
                expect(resp.body.title).toBeDefined()
                expect(resp.body.founder).toBeDefined()
                expect(resp.body._id).toBeDefined()
            })

            {/* TODO: add test using other user (diferent from the founder) mar 22 feb 2022 16:08:36  */}
        })

        describe("When has token, valid ID but is not part of the calendar", () => {

            const body = cases[0]

            test("Should respond 400", async()=>{
                const tokenA = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", tokenA)
                const calendarID = createdCalendar.body.Calendar._id

                const tokenB = await registerUser(user02R)
                const resp = await api.get(`${URI}/${calendarID}`).set("Authorization", tokenB)
                expect(resp.statusCode).toBe(400)
            })

            test("Should respond a Message", async()=>{
                const tokenA = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", tokenA)
                const calendarID = createdCalendar.body.Calendar._id

                const tokenB = await registerUser(user02R)
                const resp = await api.get(`${URI}/${calendarID}`).set("Authorization", tokenB)
                expect(resp.body.Message).toBe("You can not get this Calendar")
            })
        })

        describe("When no valid ID is sended", () => {

            test("Should respond 400", async()=>{
                const tokenA = await registerUser(user01R)
                const calendarID = "asdasdadasdas"

                const resp = await api.get(`${URI}/${calendarID}`).set("Authorization", tokenA)
                expect(resp.statusCode).toBe(400)
            })

            test("Should respond a Message", async()=>{
                const tokenA = await registerUser(user01R)
                const calendarID = "asdasdadasdas"

                const resp = await api.get(`${URI}/${calendarID}`).set("Authorization", tokenA)
                expect(resp.body.Message).toBe("Something went wrong")
                expect(resp.body.Error).toBeDefined()
            })
        })

        describe("When calendar not found", () => {

            test("Should respond 400", async()=>{
                const tokenA = await registerUser(user01R)
                const calendarID = "6214f6dca63d387a9ab0dc3a"

                const resp = await api.get(`${URI}/${calendarID}`).set("Authorization", tokenA)
                expect(resp.statusCode).toBe(400)
            })

            test("Should respond a Message", async()=>{
                const tokenA = await registerUser(user01R)
                const calendarID = "6214f6dca63d387a9ab0dc3a"

                const resp = await api.get(`${URI}/${calendarID}`).set("Authorization", tokenA)
                expect(resp.body.Message).toBe("Calendar not found")
            })
        })

        describe("When no token is provided", () => {
            const body = cases[0]

            test("Should respond 200", async()=>{
                const token = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", token)
                const calendarID = createdCalendar.body.Calendar._id

                const resp = await api.get(`${URI}/${calendarID}`)
                expect(resp.statusCode).toBe(400)
            })

            test("Should respond an Error", async()=>{
                const token = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", token)
                const calendarID = createdCalendar.body.Calendar._id

                const resp = await api.get(`${URI}/${calendarID}`)
                expect(resp.body.Error).toBe("No token provider")
            })
        })
    })


    describe("POST /", () => {
        describe("When has token and valid data", () => {

            test("Should respond 200", async()=>{
                const token = await registerUser(user01R)
                for (let body of cases) {
                    const resp = await api.post(URI).send(body).set("Authorization", token)
                    expect(resp.statusCode).toBe(200)
                }
            })

            test("Should respond with a Message and the calendar created", async()=>{
                const token = await registerUser(user01R)

                for (let body of cases) {
                    const resp = await api.post(URI).send(body).set("Authorization", token)
                    expect(resp.body.Message).toBe("New calendar created")
                    expect(resp.body.Calendar.title).toBe(body.title.toLowerCase())
                    expect(resp.body.Calendar.description).toBe(body.description)
                }
            })
            
            test("Should add a new element into the DB", async()=>{
                const allBefore = await Calendar.find()
                expect(allBefore).toHaveLength(0)

                const token = await registerUser(user01R)

                for (let body of cases) {
                    await api.post(URI).send(body).set("Authorization", token)
                }

                const allAfter = await Calendar.find()
                expect(allAfter).toHaveLength(cases.length)
            })

        })

        describe("When has token but data is not sended", () => {

            test("Should respond 400", async()=>{
                const token = await registerUser(user01R)

                for (let body of badCases) {
                    const resp = await api.post(URI).send(body).set("Authorization", token)
                    expect(resp.statusCode).toBe(400)
                }
            })

            test("Should respond with a Message and an Error", async()=>{
                const token = await registerUser(user01R)

                for (let body of badCases) {
                    const resp = await api.post(URI).send(body).set("Authorization", token)
                    expect(resp.body.Message).toBe("Something went wrong")
                    expect(resp.body.Error).toBeDefined()
                }
            })

            test("Shouldn't add into DB", async()=>{
                const token = await registerUser(user01R)

                for (let body of badCases) {
                   await api.post(URI).send(body).set("Authorization", token)
                }
                const all = await Calendar.find()
                expect(all).toHaveLength(0)
            })
        })

        describe("When no token is provided", () => {

            test("Should respond 400", async()=>{

                for (let body of cases) {
                    const resp = await api.post(URI).send(body)
                    expect(resp.statusCode).toBe(400)
                }
            })

            test("Should respond with a Message", async()=>{
                for (let body of badCases) {
                    const resp = await api.post(URI).send(body)
                    expect(resp.body.Error).toBe("No token provider")
                }
            })

            test("Shouldn't add into DB", async()=>{

                for (let body of badCases) {
                   await api.post(URI).send(body)
                }
                const all = await Calendar.find()
                expect(all).toHaveLength(0)
            })
        })
    })

    describe("PUT /:id/rename", () => {
        describe("When has token, valid ID and is founder", () => {

            const body = cases[0]

            test("Should respond 200", async()=>{
                const token = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", token)
                const calendarID = createdCalendar.body.Calendar._id

                const newData = {
                    title: "Perrosqui",
                    description: "Ndeea"
                }

                const resp = await api
                    .put(`${URI}/${calendarID}/edit`)
                    .send(newData)
                    .set("Authorization", token)
                expect(resp.statusCode).toBe(200)
            })

        })

        {/* TODO: when has token, valid data and is founder mar 22 feb 2022 11:13:08  */}
        {/* TODO: when has token, valid data but is not founder mar 22 feb 2022 11:13:08  */}
        {/* TODO: When has token but bad data mar 22 feb 2022 11:14:26  */}
        {/* TODO: when no has token mar 22 feb 2022 11:14:38  */}
    })

    describe("POST /:id/addmember", () => {
        {/* TODO: when has token and valid data mar 22 feb 2022 11:13:08  */}
        {/* TODO: When has token but bad data mar 22 feb 2022 11:14:26  */}
        {/* TODO: when no has token mar 22 feb 2022 11:14:38  */}
    })

    describe("DELETE /:id", () => {
        {/* TODO: when has token and a valid ID and is founder mar 22 feb 2022 11:13:08  */}
        {/* TODO: when has token and a valid ID but is not founder  mar 22 feb 2022 11:13:08  */}
        {/* TODO: When has token but bad id  mar 22 feb 2022 11:13:33  */}
        {/* TODO: When has token but calendar not found mar 22 feb 2022 11:14:26  */}
        {/* TODO: when no has token mar 22 feb 2022 11:14:38  */}
        // When the founder delete succesfuly, the invitations from that calendar must
        // disapear, same with the user's calendars list
    })
})
