import { Router } from "express";
import * as calendarCtrl from "../controllers/calendar.controllers";
import { getCalendarByID } from "../middlewares/getByID";
import { hasToken } from "../middlewares/hasToken";
const router = Router();

router.route("/")
    .post(hasToken, calendarCtrl.newCalendar)

router.route("/:calendarID")
    .get(hasToken, calendarCtrl.getACalendar)
    .delete(hasToken, calendarCtrl.deleteCalendar)

router.route("/:calendarID/edit")
    .put(hasToken, calendarCtrl.editCalendar)

router.route("/:calendarID/addmember")
    .post(hasToken, calendarCtrl.addMembers)

router.param("calendarID", getCalendarByID)

export default router;