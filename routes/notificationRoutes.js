const express = require("express");

const router = express.Router();

const {
  createNotification,
  getMyNotifications,
  markNotificationAsRead,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createNotification);
router.get("/", authMiddleware, getMyNotifications);
router.get("/unread-count", authMiddleware, getUnreadNotificationCount);
router.patch("/read-all", authMiddleware, markAllNotificationsAsRead);
router.patch("/:id/read", authMiddleware, markNotificationAsRead);
router.delete("/:id", authMiddleware, deleteNotification);
module.exports = router;
