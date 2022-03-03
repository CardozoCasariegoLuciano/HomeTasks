import mongoose from "mongoose";


export const IDasObject = (id: string) => {
  const newID = new mongoose.Types.ObjectId(id);
  console.log(newID)
  return newID;
};
