import Joi from "joi";
import mongoose from "mongoose";

export const calendar_validation = Joi.object({
  title: Joi.string(),
  members: Joi.array().items({id: mongoose.Types.ObjectId}),
})
