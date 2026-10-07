const connectDB = require("../config/db");
const { ObjectId } = require("mongodb");
const { getIO } = require("../socket");

const createUserNotification = async ({
  userId,
  type,
  title,
  message,
  requestId = null,
}) => {
  try {
    const db = await connectDB();

    const notification = {
      userId: new ObjectId(userId),
      type,
      title,
      message,
      requestId: requestId
        ? new ObjectId(requestId)
        : null,
      isRead: false,
      createdAt: new Date(),
    };

    const result = await db
      .collection("notifications")
      .insertOne(notification);

    const savedNotification = {
      ...notification,
      _id: result.insertedId,
    };

    const io = getIO();

    io.to(userId.toString()).emit(
      "new_notification",
      savedNotification
    );
  } catch (error) {
    console.error("Create user notification error:", error);
  }
};

module.exports = createUserNotification;