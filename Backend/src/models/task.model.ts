import { Schema, model, Document } from "mongoose";

export interface ITasks extends Document {
  title: string;
  description: string;
  options: string[];
}

const tasksSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    options: [
      {
        type: String,
        trim: true
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);


export default model<ITasks>("Task", tasksSchema)
