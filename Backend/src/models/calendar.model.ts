import mongoose, { Schema, model, Document } from "mongoose";

export interface ICalendar extends Document {
  title: string;
  description: string;
  members: mongoose.Types.ObjectId[];
  founder: mongoose.Types.ObjectId;
  tasks: mongoose.Types.ObjectId[];
}

const CalendarSchema = new Schema(
  {
    title: {
      type: String,
      lowercase: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    founder: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tasks",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default model<ICalendar>("Calendar", CalendarSchema);
