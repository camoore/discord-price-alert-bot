const Notification = require("./model");

const createNotificationDB = async (body) => {
  try {
    Notification.create(body, (err, notification) => {
      if (err) throw err;
      else return notification;
    });
  } catch (error) {
    console.error("There was an error creating this notification", error);
    return false;
  }
};

const deleteNotification = async (id, discordUserID) => {
  try {
    const notificationFound = await Notification.find({
      discordUserID,
      _id: id,
    });
    if (notificationFound) {
      await Notification.deleteOne({ _id: id });
      return notificationFound;
    } else return false;
  } catch (error) {
    console.error("There was an error deleting this notification", error);
    return [];
  }
};

const getNotifications = async (discordUserID = false) => {
  try {
    if (discordUserID) return await Notification.find({ discordUserID });
    else return await Notification.find();
  } catch (error) {
    console.log("There was an error getting notifications", error);
    return [];
  }
};

/*
  Returns 0: Can create
  Returns 1: Past Notification Threshold
  Returns 2: Already have notification for contract
  Returns 3: Error
*/

const canCreate = async (discordUserID, contractAddress) => {
  try {
    const notifications = await Notification.find({ discordUserID });
    if (notifications.length > 9) return 1;
    else if (
      notifications.filter((item) => item.contract == contractAddress).length
    )
      return 2;
    else return 0;
  } catch (error) {
    console.log("There was an error validating this notification ", error);
    return 3;
  }
};

module.exports = {
  createNotificationDB: (body) => createNotificationDB(body),
  getNotifications: (discordUserID) => getNotifications(discordUserID),
  deleteNotification: (id, discordUserID) =>
    deleteNotification(id, discordUserID),
  canCreate: (discordUserID, contractAddress) =>
    canCreate(discordUserID, contractAddress),
};
