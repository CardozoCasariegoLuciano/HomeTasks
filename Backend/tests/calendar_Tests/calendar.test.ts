import { api, getIdByToken, registerUser, user01R, user02R} from "../generic_helpers";
import mongoose from "mongoose";
import Calendar from "../../src/models/calendar.model"
import Invitation from "../../src/models/invitation.model";
import User from "../../src/models/user.model"
import { badCases, cases, URI} from "./utils";

afterAll(() => {
    mongoose.disconnect()
})

beforeEach(async () => {
    await Calendar.deleteMany({})
    await User.deleteMany({})
    await Invitation.deleteMany({})
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

    describe("PUT /:id/edit", () => {
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

            test("Should respond a Message and the new Calendar ", async()=>{
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

                expect(resp.body.Calendar.title).toBe(newData.title.toLowerCase())
                expect(resp.body.Calendar.description).toBe(newData.description)
                expect(resp.body.Message).toBe("Data succesfuly changed")
            })

            test("The calendar name and/or description mush be diferent ", async()=>{
                const token = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", token)
                const calendarID = createdCalendar.body.Calendar._id

                expect(createdCalendar.body.Calendar.title).toBe(body.title.toLowerCase())
                expect(createdCalendar.body.Calendar.description).toBeUndefined()

                const newData = {
                    title: "Perrosqui",
                    description: "Ndeea"
                }

                const resp = await api
                    .put(`${URI}/${calendarID}/edit`)
                    .send(newData)
                    .set("Authorization", token)

                expect(resp.body.Calendar.title).toBe(newData.title.toLowerCase())
                expect(resp.body.Calendar.description).toBe(newData.description)
            })
        })

        describe("When has token, valid ID and is not founder", () => {

            const body = cases[0]

            test("Should respond 400", async()=>{
                const tokenFounder = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", tokenFounder)
                const calendarID = createdCalendar.body.Calendar._id

                const newData = {
                    title: "Perrosqui",
                    description: "Ndeea"
                }

                const tokenUser = await registerUser(user02R)
                const resp = await api
                    .put(`${URI}/${calendarID}/edit`)
                    .send(newData)
                    .set("Authorization", tokenUser)
                expect(resp.statusCode).toBe(400)
            })

            test("Should respond a Message", async()=>{
                const tokenFounder = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", tokenFounder)
                const calendarID = createdCalendar.body.Calendar._id

                const newData = {
                    title: "Perrosqui",
                    description: "Ndeea"
                }

                const tokenUser = await registerUser(user02R)
                const resp = await api
                    .put(`${URI}/${calendarID}/edit`)
                    .send(newData)
                    .set("Authorization", tokenUser)

                expect(resp.body.Message).toBe("Just the founder can change the Calendar's name")
            })

            test("The calendar name and/or description mush not be diferent ", async()=>{
                const tokenFounder = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", tokenFounder)
                const calendarID = createdCalendar.body.Calendar._id

                const initialTitle = body.title.toLowerCase()

                expect(createdCalendar.body.Calendar.title).toBe(initialTitle)
                expect(createdCalendar.body.Calendar.description).toBeUndefined()

                const newData = {
                    title: "Perrosqui",
                    description: "Ndeea"
                }

                const tokenUser = await registerUser(user02R)
                await api
                    .put(`${URI}/${calendarID}/edit`)
                    .send(newData)
                    .set("Authorization", tokenUser)

                const calendar = await Calendar.findById(calendarID)

                expect(calendar!.title).toBe(initialTitle)
                expect(calendar!.description).toBeUndefined()
            })
        })

        describe("When has token, is founder but no data is sended", () => {
            const body = cases[0]

            test("Should respond 400", async()=>{
                const tokenFounder = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", tokenFounder)
                const calendarID = createdCalendar.body.Calendar._id

                const resp = await api
                    .put(`${URI}/${calendarID}/edit`)
                    .set("Authorization", tokenFounder)
                expect(resp.statusCode).toBe(400)
            })

            test("Should respond a Message and an Error", async()=>{
                const tokenFounder = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", tokenFounder)
                const calendarID = createdCalendar.body.Calendar._id

                const resp = await api
                    .put(`${URI}/${calendarID}/edit`)
                    .set("Authorization", tokenFounder)

                expect(resp.body.Message).toBe("Something went wrong")
                expect(resp.body.Error).toBeDefined()
            })

            test("The calendar name and/or description mush not be diferent ", async()=>{
                const tokenFounder = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", tokenFounder)
                const calendarID = createdCalendar.body.Calendar._id

                const initialTitle = body.title.toLowerCase()

                expect(createdCalendar.body.Calendar.title).toBe(initialTitle)
                expect(createdCalendar.body.Calendar.description).toBeUndefined()

                await api
                    .put(`${URI}/${calendarID}/edit`)
                    .set("Authorization", tokenFounder)

                const calendar = await Calendar.findById(calendarID)

                expect(calendar!.title).toBe(initialTitle)
                expect(calendar!.description).toBeUndefined()
            })
        })

        describe("When no token is provided", () => {
            const body = cases[0] 

            test("Should respond 400", async()=>{

                const tokenFounder = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", tokenFounder)
                const calendarID = createdCalendar.body.Calendar._id

                const newData = {
                    title: "New Title",
                    description: "Desc"
                }

                const resp = await api
                    .put(`${URI}/${calendarID}/edit`)
                    .send(newData)
                expect(resp.statusCode).toBe(400)
            })

            test("Should respond with an Error", async()=>{
                const tokenFounder = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", tokenFounder)
                const calendarID = createdCalendar.body.Calendar._id

                const newData = {
                    title: "New Title",
                    description: "Desc"
                }

                const resp = await api
                    .put(`${URI}/${calendarID}/edit`)
                    .send(newData)
                    expect(resp.body.Error).toBe("No token provider")
            })

            test("The calendar name and/or description mush not be diferent", async()=>{

                const tokenFounder = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", tokenFounder)
                const calendarID = createdCalendar.body.Calendar._id

                const initialTitle = body.title.toLowerCase()

                expect(createdCalendar.body.Calendar.title).toBe(initialTitle)
                expect(createdCalendar.body.Calendar.description).toBeUndefined()

                const newData = {
                    title: "New Title",
                    description: "Desc"
                }

                await api
                    .put(`${URI}/${calendarID}/edit`)
                    .send(newData)

                const calendar = await Calendar.findById(calendarID)

                expect(calendar!.title).toBe(initialTitle)
                expect(calendar!.description).toBeUndefined()
            })
        })
    })

    describe("POST /:id/addmember", () => {
        describe("When has token, valid data and is founder", () => {
            const body = cases[0] 

            test("Should respond 200", async()=>{
                const tokenUser = await registerUser(user02R)
                const userID = await getIdByToken(tokenUser)

                const tokenFounder = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", tokenFounder)
                const calendarID = createdCalendar.body.Calendar._id

                const data = {
                    members: [userID],
                    message: "invited test"
                }

                const resp = await api.post(`${URI}/${calendarID}/addmember`).send(data).set("Authorization", tokenFounder)
                expect(resp.statusCode).toBe(200)
            })

            test("Should add new Invitation into DB", async()=>{
                const tokenUser = await registerUser(user02R)
                const userID = await getIdByToken(tokenUser)

                const tokenFounder = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", tokenFounder)
                const calendarID = createdCalendar.body.Calendar._id

                const data = {
                    members: [userID],
                    message: "invited test"
                }

                const initialDB = await Invitation.find()
                expect(initialDB).toHaveLength(0)

                await api.post(`${URI}/${calendarID}/addmember`).send(data).set("Authorization", tokenFounder)
                const dbresult = await Invitation.find()
                expect(dbresult).toHaveLength(1)
            })

            test("The user should have a new invitations", async()=>{
                const tokenUser = await registerUser(user02R)
                const userID = await getIdByToken(tokenUser)

                const tokenFounder = await registerUser(user01R)
                const createdCalendar = await api.post(URI).send(body).set("Authorization", tokenFounder)
                const calendarID = createdCalendar.body.Calendar._id

                const data = {
                    members: [userID],
                    message: "invited test"
                }

                const initialUserDB = await User.findById(userID)
                expect(initialUserDB!.invitations).toHaveLength(0)

                await api.post(`${URI}/${calendarID}/addmember`).send(data).set("Authorization", tokenFounder)
                const bdUserResut = await User.findById(userID)
                expect(bdUserResut!.invitations).toHaveLength(1)
            })
        })

        describe("When has token, valid data but is not founder", () => {
            {/* TODO: Should reutrn 400 vie 25 feb 2022 17:52:42  */}
            {/* TODO: Should return an Error vie 25 feb 2022 17:52:57  */}
            {/* TODO: No invitation must be created vie 25 feb 2022 17:53:15  */}
            {/* TODO: Users mustn't have new invitations  vie 25 feb 2022 17:53:37  */}
        })

        describe("When has token, is founder but no data is sended", () => {
            {/* TODO: Should reutrn 400 vie 25 feb 2022 17:52:42  */}
            {/* TODO: Should return a Message and an Error vie 25 feb 2022 17:52:57  */}
            {/* TODO: No invitation must be created vie 25 feb 2022 17:53:15  */}
            {/* TODO: Users mustn't have new invitations  vie 25 feb 2022 17:53:37  */}
        })

        describe("When has token, is founder but user not found", () => {
            {/* TODO: Should reutrn 400 vie 25 feb 2022 17:52:42  */}
            {/* TODO: Should return an Error vie 25 feb 2022 17:52:57  */}
            {/* TODO: No invitation must be created vie 25 feb 2022 17:53:15  */}
            {/* TODO: Users mustn't have new invitations  vie 25 feb 2022 17:53:37  */}
        })

        describe("When has token, is founder but user is already part of the calendar or was already invited", () => {
            {/* TODO: Should reutrn 200 vie 25 feb 2022 17:52:42  */}
            {/* TODO: Should return a Message vie 25 feb 2022 17:52:57  */}
            {/* TODO: No invitation must be created vie 25 feb 2022 17:53:15  */}
            {/* TODO: Users mustn't have new invitations  vie 25 feb 2022 17:53:37  */}
        })

        describe("When no token is provided", () => {
            {/* TODO: Should respond 400 vie 25 feb 2022 18:18:58  */}
            {/* TODO: Should respond an Error vie 25 feb 2022 18:19:16  */}
            {/* TODO: No invitation must be created vie 25 feb 2022 17:53:15  */}
            {/* TODO: Users mustn't have new invitations  vie 25 feb 2022 17:53:37  */}
        })
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
