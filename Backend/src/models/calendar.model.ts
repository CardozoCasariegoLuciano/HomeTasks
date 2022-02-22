import { Schema, model, Document } from "mongoose";

export interface ICalendar extends Document {
  title: string;
  description: string;
  members: Schema.Types.ObjectId[];
  admins: Schema.Types.ObjectId[];
  founder: Schema.Types.ObjectId;
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
      trim: true
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
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default model<ICalendar>("Calendar", CalendarSchema);
