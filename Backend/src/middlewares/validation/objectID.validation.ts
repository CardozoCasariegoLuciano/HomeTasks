import Joi from "joi";
import mongoose from "mongoose";

export const objectID_validation = Joi.object({
   id: mongoose.Types.ObjectId
});
