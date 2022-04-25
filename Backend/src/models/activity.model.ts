import mongoose, { Schema, model, Document } from "mongoose";

export interface IActivity extends Document {
  user: mongoose.Types.ObjectId;
  mondays: mongoose.Types.ObjectId[];
  activities: {
    thusdays: mongoose.Types.ObjectId[];
    wednesdays: mongoose.Types.ObjectId[];
    thursdays: mongoose.Types.ObjectId[];
    fridays: mongoose.Types.ObjectId[];
    saturdays: mongoose.Types.ObjectId[];
    sundays: mongoose.Types.ObjectId[];
  }
  calendar_id: mongoose.Types.ObjectId[];
}

const ActivitySchema = new Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required:true,
    },
    activities: {
      mondays: [
        {
          type: mongoose.Types.ObjectId,
          ref: "TaskToDo",
        },
      ],
      thusdays: [
        {
          type: mongoose.Types.ObjectId,
          ref: "TaskToDo",
        },
      ],
      wednesdays: [
        {
          type: mongoose.Types.ObjectId,
          ref: "TaskToDo",
        },
      ],
      thursdays: [
        {
          type: mongoose.Types.ObjectId,
          ref: "TaskToDo",
        },
      ],
      fridays: [
        {
          type: mongoose.Types.ObjectId,
          ref: "TaskToDo",
        },
      ],
      saturdays: [
        {
          type: mongoose.Types.ObjectId,
          ref: "TaskToDo",
        },
      ],
      sundays: [
        {
          type: mongoose.Types.ObjectId,
          ref: "TaskToDo",
        },
      ],
    },
    calendar_id: {
      type: mongoose.Types.ObjectId,
      ref: "Calendar",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default model<IActivity>("Activity", ActivitySchema);
