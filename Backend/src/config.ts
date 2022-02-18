import dotenv from "dotenv";
dotenv.config()

export const config = {
    APP_PORT: process.env.APP_PORT || 4500,

    DB_HOST: process.env.DB_HOST || "localhost",
    DB_PORT: process.env.DB_PORT || 27017,
    DB_NAME: process.env.DB_NAME || "taskHome",
    DB_NAME_TEST: process.env.DB_NAME_TEST || "taskHome_test",

    TOKEN_KEY: process.env.TOKEN_KEY || "notTheRealKeylol"
}
