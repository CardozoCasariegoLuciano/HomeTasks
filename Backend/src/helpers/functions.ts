import mongoose from "mongoose";

export const IDasObject = (id: string) => {
  const newID = new mongoose.Types.ObjectId(id);
  return newID;
};

export const isValidID = (id: string) => {
  const ret = mongoose.isValidObjectId(id);
  return ret;
};
