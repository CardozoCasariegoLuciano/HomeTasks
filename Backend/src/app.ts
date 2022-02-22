import express from "express";
import morgan from "morgan";
import {config} from "./config";
import "./database/database"

import authroutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import calendarRoutes from "./routes/calendar.routes";

const app = express()

//APP config
app.set("PORT",config.APP_PORT)


//middlewares
app.use(express.json())
app.use(morgan("dev", {skip: (req, res) => process.env.NODE_ENV === "test"}))


//routes
app.use("/api/auth/", authroutes)
app.use("/api/user/", userRoutes)
app.use("/api/calendar/", calendarRoutes)

export default app
