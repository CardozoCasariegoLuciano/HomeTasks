import Joi from "joi";
import mongoose from "mongoose";

export const calendar_validation = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().min(5)
})

export const calendar_membersList_validation = Joi.object({
  list: Joi.array().items({id: mongoose.Types.ObjectId}).required(),
})
