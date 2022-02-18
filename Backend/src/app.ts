import express from "express";
import morgan from "morgan";
import {config} from "./config";
import "./database/database"

import authroutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
const app = express()

//APP config
app.set("PORT",config.APP_PORT)


//middlewares
app.use(express.json())
app.use(morgan("dev"))


//routes
app.use("/api/auth/", authroutes)
app.use("/api/user/", userRoutes)

export default app
