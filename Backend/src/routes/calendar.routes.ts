import { Router } from "express";
import * as calendarCtrl from "../controllers/calendar.controllers";
import { getActivityByID, getCalendarByID, getTaskByID } from "../middlewares/getByID";
import { hasToken } from "../middlewares/hasToken";
const router = Router();


//-->  /api/calendar/ === /

router.route("/")
    .post(hasToken, calendarCtrl.newCalendar)

router.route("/:calendarID")
    .get(hasToken, calendarCtrl.getACalendar)
    .delete(hasToken, calendarCtrl.deleteCalendar)

router.route("/:calendarID/edit")
    .put(hasToken, calendarCtrl.editCalendar)

router.route("/:calendarID/addmember")
    .post(hasToken, calendarCtrl.addMembers)

router.route("/:calendarID/deletemembers")
    .delete(hasToken, calendarCtrl.deleteMember)

router.route("/:calendarID/invitations")
    .get(hasToken, calendarCtrl.getInvitations)


router.route("/:calendarID/addtask")
    .post(hasToken, calendarCtrl.createTask)

router.route("/:calendarID/tasks")
    .get(hasToken, calendarCtrl.getAllTasks)

router.route("/:calendarID/task/:taskID")
    .get(hasToken, calendarCtrl.getATask)
    .delete(hasToken, calendarCtrl.deleteTask)

router.route("/:calendarID/task/:taskID/option")
    .post(hasToken, calendarCtrl.addTaskOption)
    .put(hasToken, calendarCtrl.editTaksOptions)


router.route("/:calendarID/activity")
    .post(hasToken, calendarCtrl.addToDo)
    .get(hasToken, calendarCtrl.getToDos)

router.route("/:calendarID/activity/:activityID")
    .get(hasToken, calendarCtrl.getAToDo)
    .delete(hasToken, calendarCtrl.deleteToDo)
    .put(hasToken, calendarCtrl.updateToDo)


router.param("calendarID", getCalendarByID)
router.param("taskID", getTaskByID)
router.param("activityID", getActivityByID)

export default router;
