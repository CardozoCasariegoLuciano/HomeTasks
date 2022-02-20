import supertest from "supertest";
import app from "../app";

export const api = supertest(app);

