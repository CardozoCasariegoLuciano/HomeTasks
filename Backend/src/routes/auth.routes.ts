import { Router } from "express";
const router = Router();
import * as authCtrl from "../controllers/auth.controllers";

router.route("/login")
    .post(authCtrl.login);

router.route("/register")
    .post(authCtrl.register);

export default router;
