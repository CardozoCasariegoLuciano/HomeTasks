import Joi from "joi";

export const register_validation = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  repited_password: Joi.ref("password"),
});

export const login_validation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const changeName_validation = Joi.object({
  name: Joi.string().min(3).required(),
});
