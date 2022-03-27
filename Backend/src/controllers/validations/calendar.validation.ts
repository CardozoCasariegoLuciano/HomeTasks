import Joi from "joi";
import mongoose from "mongoose";

export const calendar_validation = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().min(5),
});

export const calendar_membersList_validation = Joi.object({
  list: Joi.array().items({ id: mongoose.Types.ObjectId }).required(),
});

export const calendar_tasks = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().min(5),
  options: Joi.array().items(Joi.string()),
});

export const calendar_option_tasks = Joi.object({
  options: Joi.array().items(Joi.string()).required(),
});

export const calendar_ToDo = Joi.object({
  user: Joi.string().min(3).required(),
  activities: Joi.object({
    mondays: Joi.array().required(),
    thusdays: Joi.array().required(),
    wednesdays: Joi.array().required(),
    thursdays: Joi.array().required(),
    fridays: Joi.array().required(),
    saturdays: Joi.array().required(),
    sundays: Joi.array().required(),
  }).required(),
});
