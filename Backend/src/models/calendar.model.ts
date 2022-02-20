import { Schema, model, Document } from "mongoose";

export interface ICalendar extends Document {
  title: string;
  members: Schema.Types.ObjectId[];
  admins: Schema.Types.ObjectId[];
  founder: Schema.Types.ObjectId;
  prevWeek: Schema.Types.ObjectId;
}

const CalendarSchema = new Schema(
  {
    title: {
      type: String,
      lowercase: true,
      required: true,
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
    prevWeek: {
      type: Schema.Types.ObjectId,
      ref: "Calendar",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default model<ICalendar>("Calendar", CalendarSchema);
