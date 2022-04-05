import {
  api,
  getIdByToken,
  registerUser,
  userToRegister,
} from "../generic_helpers";
import User from "../../src/models/user.model";


export const URI = "/api/activities/"

export const setUp = async () => {

  const body = { title: "Title1"}
  const URIcalendar = "/api/calendar"
  const tokenFounder = await registerUser(userToRegister[0]);
  const tokenUser = await registerUser(userToRegister[1]);
  const userID = await getIdByToken(tokenUser);

  //Create calendar
  const createdCalendar = await api
    .post(URIcalendar)
    .send(body)
    .set("Authorization", tokenFounder);
  const calendarID = createdCalendar.body.Calendar._id;

  //Adding a task
  const data = {
    title: "Baños",
    description: "Limpiar el baño y lavar la ropa",
  };
  const createdTask = await api
    .post(`${URIcalendar}/${calendarID}/addtask`)
    .send(data)
    .set("Authorization", tokenFounder);
  const taskID = createdTask.body.Task._id;

  //Inviting user
  await api
    .post(`${URIcalendar}/${calendarID}/addmember`)
    .send({ members: [userID] })
    .set("Authorization", tokenFounder);
  //Accept invitation
  const userLoged = await User.findById(userID);
  const inviID = userLoged!.invitations[0];

  //accepting invitation
  await api
    .post(`/api/invitations/${inviID}/accept`)
    .set("Authorization", tokenUser);

  //Adding a user activity
  const activity = {
    user: userID,
    activities: {
      mondays: [taskID, taskID],
      thusdays: [],
      wednesdays: [taskID],
      thursdays: [],
      fridays: [taskID],
      saturdays: [taskID],
      sundays: [],
    },
  };
  const createdActivity = await api
    .post(`${URIcalendar}/${calendarID}/activity`)
    .send(activity)
    .set("Authorization", tokenFounder);

  return {
    userID,
    tokenUser,
    tokenFounder,
    calendarID,
    activity,
    taskID,
    createdActivity : createdActivity.body.Activity,
  };
};
