import { Router } from "express";
const router = Router()
import * as userCtrl from "../controllers/user.controllers";
import {getUserByID} from "../middlewares/getByID";
import {hasToken} from "../middlewares/hasToken";

router.route("/")
    .get(userCtrl.getUsers)

router.route("/:userId")
    .get(userCtrl.getAUser)

router.route("/rename")
    .post(hasToken , userCtrl.changeName)


router.param("userId", getUserByID)


export default router
