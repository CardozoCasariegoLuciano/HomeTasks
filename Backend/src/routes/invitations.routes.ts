import { Router } from "express";
const router = Router()
import * as inviCtrl from "../controllers/invitation.controllers";
import {getInvitationByID} from "../middlewares/getByID";
import {hasToken} from "../middlewares/hasToken";


router.route("/")
    .get(hasToken , inviCtrl.getInvitations)

router.route("/:inviId")
    .get(hasToken, inviCtrl.getAInvitation)
    .post(hasToken, inviCtrl.occultInvi)

router.route("/:inviId/accept")
    .post(hasToken , inviCtrl.acceptInvitation)

router.route("/:inviId/reject")
    .post(hasToken , inviCtrl.rejectInvitation)



router.param("inviId", getInvitationByID)


export default router
