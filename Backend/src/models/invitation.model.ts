import mongoose, { Schema, model, Document } from "mongoose";

export interface Iinvitation extends Document {
  calendarName: string;
  message: string;
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  calendarID: mongoose.Types.ObjectId;
  status: string;
  show: boolean
}

const InvitationSchema = new Schema(
  {
    calendarName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    calendarID: {
      type: Schema.Types.ObjectId,
      ref: "Calendar",
      required: true,
    },
    status: {
      type: String,
      default: "Pending",
    },
    show: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default model<Iinvitation>("Invitation", InvitationSchema);
