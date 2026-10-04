const connectDB = require("../config/db");
const { ObjectId } = require("mongodb");

const createNotification = async (req, res) => {
  try {
    const { type, title, message, requestId } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "Notification-এর প্রয়োজনীয় তথ্য দেওয়া হয়নি",
      });
    }

    if (requestId && !ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "সঠিক request ID দেওয়া হয়নি",
      });
    }

    const db = await connectDB();

    const notification = {
      userId: new ObjectId(req.user.userId),
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

    res.status(201).json({
      success: true,
      message: "Notification সফলভাবে তৈরি হয়েছে",
      notificationId: result.insertedId,
    });
  } catch (error) {
    console.error("Create notification error:", error);

    res.status(500).json({
      success: false,
      message: "Notification তৈরি করতে সমস্যা হয়েছে",
    });
  }
};


const getMyNotifications = async (req, res) => {
  try {
    const db = await connectDB();

    const notifications = await db
      .collection("notifications")
      .find({
        userId: new ObjectId(req.user.userId),
      })
      .sort({
        createdAt: -1,
      })
      .toArray();

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    res.status(500).json({
      success: false,
      message: "Notification আনতে সমস্যা হয়েছে",
    });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "সঠিক notification ID দেওয়া হয়নি",
      });
    }

    const db = await connectDB();

    const result = await db.collection("notifications").updateOne(
      {
        _id: new ObjectId(id),
        userId: new ObjectId(req.user.userId),
      },
      {
        $set: {
          isRead: true,
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification পাওয়া যায়নি",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification পড়া হয়েছে",
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);

    res.status(500).json({
      success: false,
      message: "Notification update করতে সমস্যা হয়েছে",
    });
  }
};

const getUnreadNotificationCount = async (req, res) => {
  try {
    const db = await connectDB();

    const count = await db.collection("notifications").countDocuments({
      userId: new ObjectId(req.user.userId),
      isRead: false,
    });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Get unread notification count error:", error);

    res.status(500).json({
      success: false,
      message: "Unread notification count আনতে সমস্যা হয়েছে",
    });
  }
};


const markAllNotificationsAsRead = async (req, res) => {
  try {
    const db = await connectDB();

    const result = await db.collection("notifications").updateMany(
      {
        userId: new ObjectId(req.user.userId),
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "সব Notification পড়া হয়েছে",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);

    res.status(500).json({
      success: false,
      message: "সব Notification update করতে সমস্যা হয়েছে",
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "সঠিক notification ID দেওয়া হয়নি",
      });
    }

    const db = await connectDB();

    const result = await db.collection("notifications").deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(req.user.userId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification পাওয়া যায়নি",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification মুছে ফেলা হয়েছে",
    });
  } catch (error) {
    console.error("Delete notification error:", error);

    res.status(500).json({
      success: false,
      message: "Notification মুছে ফেলতে সমস্যা হয়েছে",
    });
  }
};

module.exports = {
    createNotification,
    getMyNotifications,
    markNotificationAsRead,
    getUnreadNotificationCount,
    markAllNotificationsAsRead,
     deleteNotification
};