import { Router } from "express";
const router = Router();
import * as actCtrl from "../controllers/activities.controllers";
import {getCalendarByID} from "../middlewares/getByID";
import {hasToken} from "../middlewares/hasToken";

router.route("/")
  .get(hasToken, actCtrl.getAllActivities)

router.route("/calendar/:calendarID")
  .get(hasToken, actCtrl.getAllActivities)

router.param("calendarID", getCalendarByID)

export default router;
