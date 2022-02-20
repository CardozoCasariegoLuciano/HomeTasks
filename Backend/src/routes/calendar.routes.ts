import { Router } from "express";
import * as calendarCtrl from "../controllers/calendar.controllers"
import {getCalendarByID} from "../middlewares/getByID";
import {hasToken} from "../middlewares/hasToken"
const router= Router()

router.route("/")
    .get(calendarCtrl.getCalendars)
    .post(hasToken, calendarCtrl.newCalendar)

router.route("/:calendarID")
    .get(calendarCtrl.getACalendar)
    .delete(hasToken, calendarCtrl.deleteCalendar)

router.route("/:calendarID/rename")
    .put(hasToken, calendarCtrl.renameCalendar)

router.route("/:calendarID/addmember")
    .post(hasToken, calendarCtrl.addMembers)

router.param("calendarID", getCalendarByID)


export default router
