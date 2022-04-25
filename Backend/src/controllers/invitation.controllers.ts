import { Request, Response } from "express";
import User from "../models/user.model";
import Invitation from "../models/invitation.model";
import Calendar from "../models/calendar.model";
import { IDasObject } from "../helpers/functions";


export const getInvitations = async (req: Request, res: Response) => {
  try {
    const userID = req.userLoged;
    const allInvits = await Invitation.find({ to: userID })
    res.json(allInvits);
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const getAInvitation = async (req: Request, res: Response) => {
  try {
    const invi = req.invitation
    const userID = req.userLoged

    if (userID.toString() != invi.to.toString()) {
      return res
        .status(400)
        .json({Error: "Cant ask for other user invitation"});
      }

    res.json(invi);
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const occultInvi = async (req: Request ,res:Response) => {
  try{
    const invitation = req.invitation;
    const userID = req.userLoged

    if (userID.toString() != invitation.to.toString()) {
      return res
        .status(400)
        .json({Error: "Cant ask for other user invitation"});
      }

    invitation.show = !invitation.show
    await invitation.save()

    const Message = invitation.show ? "Visible" : "Occult"

    res.json({ Message });
  }catch(err){
    return res.status(400).json({Message: "Something went wrong", Error: err})
  }
}

export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const userID = req.userLoged;
    const invitation = req.invitation;

    const user = await User.findById(userID);
    const invi = await Invitation.findById(invitation._id);
    const calendar = await Calendar.findById(invitation.calendarID);

    if (calendar && invi) {
      if (invi.to.toString() != userID) {
        return res.status(400).json({Error: "no valid invitation for user logued"})
      }

      user!.invitations = user!.invitations.filter( (inviID) => inviID.toString() != invitation._id.toString());
      user!.calendars.push(invitation.calendarID)
      invi!.status = "Accepted";
      calendar.members.push(IDasObject(userID));

      await user!.save();
      await invi!.save();
      await calendar.save();

      res.json({ Message: "Successfully accepted" });
    } else {
      res.status(400).json({ Error: "Calendar not found" });
    }
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

export const rejectInvitation = async (req: Request, res: Response) => {
  try {
    const userID = req.userLoged;
    const invitation = req.invitation;

    if (invitation.to.toString() != userID) {
      return res.status(400).json({Error: "no valid invitation for user logued"})
    }

    const user = await User.findById(userID);
    const invi = await Invitation.findById(invitation._id);

    user!.invitations = user!.invitations.filter(
      (inviID) => inviID.toString() != invitation._id.toString()
    );
    invi!.status = "Rejected";

    await user!.save();
    await invi!.save();

    res.json({ Message: "Successfully rejected" });
  } catch (err) {
    return res
      .status(400)
      .json({ Message: "Something went wrong", Error: err });
  }
};

