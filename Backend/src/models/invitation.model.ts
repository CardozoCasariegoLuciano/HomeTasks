import { Schema, model, Document } from "mongoose";

export interface Iinvitation extends Document {
  calendarName: string;
  message: string;
  from: Schema.Types.ObjectId;
  to: Schema.Types.ObjectId;
  calendarID: Schema.Types.ObjectId;
  isAcepted: boolean;
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
    isAcepted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default model<Iinvitation>("Invitation", InvitationSchema);
