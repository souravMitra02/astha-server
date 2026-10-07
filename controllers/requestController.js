const connectDB = require("../config/db");
const { ObjectId } = require("mongodb");
const createUserNotification = require("../utils/notificationHelper");

const createRequest = async (req, res) => {
  try {
    const { serviceId, message } = req.body;

    if (!serviceId || !message) {
      return res.status(400).json({
        success: false,
        message: "সেবার আইডি এবং বার্তা দেওয়া আবশ্যক",
      });
    }

    if (!ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        message: "সঠিক সার্ভিস আইডি দেওয়া হয়নি",
      });
    }

    const db = await connectDB();

    const user = await db.collection("users").findOne({
      _id: new ObjectId(req.user.userId),
    });

    const service = await db.collection("services").findOne({
      _id: new ObjectId(serviceId),
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "সার্ভিসটি পাওয়া যায়নি",
      });
    }

    if (service.providerId.toString() === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: "নিজের সেবায় অনুরোধ করা যাবে না",
      });
    }

    const existingRequest = await db.collection("requests").findOne({
      serviceId: new ObjectId(serviceId),
      userId: new ObjectId(req.user.userId),
      status: {
        $in: ["pending", "accepted"],
      },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "এই সেবার জন্য আপনার একটি অনুরোধ ইতিমধ্যে রয়েছে",
      });
    }

    const newRequest = {
      serviceId: new ObjectId(serviceId),
      userId: new ObjectId(req.user.userId),
      providerId: new ObjectId(service.providerId),
      status: "pending",
      message,
      createdAt: new Date(),
    };

    const result = await db
      .collection("requests")
      .insertOne(newRequest);

    await createUserNotification({
      userId: service.providerId,
      type: "new_request",
      title: "নতুন সেবার অনুরোধ",
      message: `${user.name} আপনার "${service.title}" সেবার জন্য অনুরোধ করেছেন।`,
      requestId: result.insertedId,
    });

    res.status(201).json({
      success: true,
      message: "সেবার অনুরোধ সফলভাবে পাঠানো হয়েছে",
      requestId: result.insertedId,
    });
  } catch (error) {
    console.error("Create request error:", error);

    res.status(500).json({
      success: false,
      message: "সেবার অনুরোধ পাঠাতে সমস্যা হয়েছে",
    });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const db = await connectDB();

    const userId = req.user.userId;

    const requests = await db
      .collection("requests")
      .aggregate([
        {
          $match: {
            userId: new ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: "services",
            localField: "serviceId",
            foreignField: "_id",
            as: "service",
          },
        },
        {
          $unwind: "$service",
        },
        {
          $lookup: {
            from: "users",
            localField: "providerId",
            foreignField: "_id",
            as: "provider",
          },
        },
        {
          $unwind: {
            path: "$provider",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            serviceId: 1,
            userId: 1,
            providerId: 1,
            status: 1,
            message: 1,
            createdAt: 1,
            updatedAt: 1,

            serviceTitle: "$service.title",
            serviceCategory: "$service.category",

            providerName: "$provider.name",
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get my requests error:", error);

    res.status(500).json({
      success: false,
      message: "আপনার অনুরোধগুলো আনতে সমস্যা হয়েছে",
    });
  }
};

const getProviderRequests = async (req, res) => {
  try {
    const db = await connectDB();

    const providerId = req.user.userId;

    const requests = await db
      .collection("requests")
      .aggregate([
        {
          $match: {
            providerId: new ObjectId(providerId),
          },
        },
        {
          $lookup: {
            from: "services",
            localField: "serviceId",
            foreignField: "_id",
            as: "service",
          },
        },
        {
          $unwind: "$service",
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            serviceId: 1,
            userId: 1,
            providerId: 1,
            status: 1,
            message: 1,
            createdAt: 1,
            updatedAt: 1,
            serviceTitle: "$service.title",
            serviceCategory: "$service.category",
            userName: "$user.name",
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get provider requests error:", error);

    res.status(500).json({
      success: false,
      message: "আপনার কাছে আসা অনুরোধগুলো আনতে সমস্যা হয়েছে",
    });
  }
};

/* =========================================
   Provider Dashboard Statistics
========================================= */

const getProviderStats = async (req, res) => {
  try {
    const db = await connectDB();

    const providerId = req.user.userId;

    if (!ObjectId.isValid(providerId)) {
      return res.status(400).json({
        success: false,
        message: "সঠিক provider ID পাওয়া যায়নি",
      });
    }

    const provider = await db.collection("users").findOne({
      _id: new ObjectId(providerId),
      role: "provider",
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "সেবাদাতা পাওয়া যায়নি",
      });
    }

    const requestStats = await db
      .collection("requests")
      .aggregate([
        {
          $match: {
            providerId: new ObjectId(providerId),
          },
        },
        {
          $group: {
            _id: "$status",
            count: {
              $sum: 1,
            },
          },
        },
      ])
      .toArray();

    const stats = {
      totalRequests: 0,
      pendingRequests: 0,
      acceptedRequests: 0,
      completedRequests: 0,
      rejectedRequests: 0,
      cancelledRequests: 0,
    };

    requestStats.forEach((item) => {
      stats.totalRequests += item.count;

      if (item._id === "pending") {
        stats.pendingRequests = item.count;
      }

      if (item._id === "accepted") {
        stats.acceptedRequests = item.count;
      }

      if (item._id === "completed") {
        stats.completedRequests = item.count;
      }

      if (item._id === "rejected") {
        stats.rejectedRequests = item.count;
      }

      if (item._id === "cancelled") {
        stats.cancelledRequests = item.count;
      }
    });

    const reviewStats = await db
      .collection("reviews")
      .aggregate([
        {
          $match: {
            providerId: new ObjectId(providerId),
          },
        },
        {
          $group: {
            _id: null,
            totalReviews: {
              $sum: 1,
            },
            averageRating: {
              $avg: "$rating",
            },
          },
        },
      ])
      .toArray();

    const totalReviews = reviewStats[0]?.totalReviews || 0;

    const averageRating = reviewStats[0]?.averageRating
      ? Number(reviewStats[0].averageRating.toFixed(1))
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        ...stats,
        totalReviews,
        averageRating,
      },
    });
  } catch (error) {
    console.error("Get provider stats error:", error);

    res.status(500).json({
      success: false,
      message: "Provider statistics আনতে সমস্যা হয়েছে",
    });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "সঠিক request ID দেওয়া হয়নি",
      });
    }

    if (!["accepted", "rejected", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "সঠিক status দেওয়া হয়নি",
      });
    }

    const db = await connectDB();

    const request = await db.collection("requests").findOne({
      _id: new ObjectId(id),
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request পাওয়া যায়নি",
      });
    }

    if (request.providerId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "এই request পরিবর্তন করার অনুমতি আপনার নেই",
      });
    }

    if (status === "accepted" || status === "rejected") {
      if (request.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "শুধু pending request গ্রহণ বা প্রত্যাখ্যান করা যাবে",
        });
      }
    }

    if (status === "completed") {
      if (request.status !== "accepted") {
        return res.status(400).json({
          success: false,
          message: "শুধু accepted request completed করা যাবে",
        });
      }
    }

    const service = await db.collection("services").findOne({
      _id: request.serviceId,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "সার্ভিসটি পাওয়া যায়নি",
      });
    }

    const result = await db.collection("requests").updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Request status পরিবর্তন করা যায়নি",
      });
    }

    let notificationTitle = "";
    let notificationMessage = "";

    if (status === "accepted") {
      notificationTitle = "আপনার অনুরোধ গ্রহণ করা হয়েছে";
      notificationMessage = `আপনার "${service.title}" সেবার অনুরোধটি গ্রহণ করা হয়েছে।`;
    }

    if (status === "rejected") {
      notificationTitle = "আপনার অনুরোধ প্রত্যাখ্যান করা হয়েছে";
      notificationMessage = `আপনার "${service.title}" সেবার অনুরোধটি প্রত্যাখ্যান করা হয়েছে।`;
    }

    if (status === "completed") {
      notificationTitle = "আপনার সেবা সম্পন্ন হয়েছে";
      notificationMessage = `আপনার "${service.title}" সেবার অনুরোধটি সম্পন্ন হয়েছে।`;
    }

    await createUserNotification({
      userId: request.userId,
      type: "request_status",
      title: notificationTitle,
      message: notificationMessage,
      requestId: request._id,
    });

    res.status(200).json({
      success: true,
      message: `Request ${status} হয়েছে`,
    });
  } catch (error) {
    console.error("Update request status error:", error);

    res.status(500).json({
      success: false,
      message: "Request status পরিবর্তন করতে সমস্যা হয়েছে",
    });
  }
};

const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "সঠিক request ID দেওয়া হয়নি",
      });
    }

    const db = await connectDB();

    const request = await db.collection("requests").findOne({
      _id: new ObjectId(id),
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request পাওয়া যায়নি",
      });
    }

    if (request.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "এই request বাতিল করার অনুমতি আপনার নেই",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "শুধু pending request বাতিল করা যাবে",
      });
    }

    const result = await db.collection("requests").updateOne(
      {
        _id: new ObjectId(id),
        status: "pending",
      },
      {
        $set: {
          status: "cancelled",
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Request বাতিল করা যায়নি",
      });
    }

    res.status(200).json({
      success: true,
      message: "Request সফলভাবে বাতিল করা হয়েছে",
    });
  } catch (error) {
    console.error("Cancel request error:", error);

    res.status(500).json({
      success: false,
      message: "Request বাতিল করতে সমস্যা হয়েছে",
    });
  }
};

const getSingleRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "সঠিক request ID দেওয়া হয়নি",
      });
    }

    const db = await connectDB();

    const request = await db.collection("requests").findOne({
      _id: new ObjectId(id),
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request পাওয়া যায়নি",
      });
    }

    const userId = req.user.userId;

    if (
      request.userId.toString() !== userId &&
      request.providerId.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "এই request দেখার অনুমতি আপনার নেই",
      });
    }

    const service = await db.collection("services").findOne({
      _id: request.serviceId,
    });

    const provider = await db.collection("users").findOne(
      {
        _id: request.providerId,
      },
      {
        projection: {
          name: 1,
          email: 1,
          phone: 1,
        },
      }
    );

    res.status(200).json({
      success: true,
      request: {
        ...request,
        serviceTitle: service?.title || "",
        serviceCategory: service?.category || "",
        providerName: provider?.name || "",
        providerEmail: provider?.email || "",
        providerPhone: provider?.phone || "",
      },
    });
  } catch (error) {
    console.error("Get single request error:", error);

    res.status(500).json({
      success: false,
      message: "Request-এর তথ্য আনতে সমস্যা হয়েছে",
    });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getProviderRequests,
  getProviderStats,
  updateRequestStatus,
  getSingleRequest,
  cancelRequest,
};