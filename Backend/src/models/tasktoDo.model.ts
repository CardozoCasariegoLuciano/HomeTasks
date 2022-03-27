import mongoose,{ Schema, model, Document } from "mongoose";

export interface ITasksToDo extends Document {
  taskID: mongoose.Types.ObjectId;
  done: boolean;
}

const tasksSchema = new Schema(
  {
    taskID: {
      type: mongoose.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    done:{
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);


export default model<ITasksToDo>("TaskToDo", tasksSchema)
