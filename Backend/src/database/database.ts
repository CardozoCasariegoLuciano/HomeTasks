import mongoose from "mongoose";
import { config } from "../config";

const database = process.env.NODE_ENV === "test" ? config.DB_NAME_TEST : config.DB_NAME

const URI = `mongodb://${config.DB_HOST}:${config.DB_PORT}/${database}`;

const conectDB = () => {
  mongoose.connect(URI);
  console.log(
    `Data base: ${database} is running on ${process.env.NODE_ENV} environment`
  );
};

conectDB();
