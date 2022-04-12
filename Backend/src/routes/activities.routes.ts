import { Router } from "express";
const router = Router();
import * as actCtrl from "../controllers/activities.controllers";
import {getCalendarByID, getActivityByID, getToDoByID} from "../middlewares/getByID";
import {hasToken} from "../middlewares/hasToken";

router.route("/")
  .get(hasToken, actCtrl.getAllActivities)

router.route("/activity/:activityID/:todoID")
  .get(hasToken, actCtrl.getATodo)

router.route("/activity/:activityID/:todoID/done")
  .post(hasToken, actCtrl.toggleDONE)


router.param("calendarID", getCalendarByID)
router.param("activityID", getActivityByID)
router.param("todoID", getToDoByID)

export default router;
