const connectDB = require("../config/db");
const { ObjectId } = require("mongodb");
const createUserNotification = require("../utils/notificationHelper");

const createReview = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rating, comment = "" } = req.body;

    if (!ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "সঠিক request ID দেওয়া হয়নি",
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating অবশ্যই ১ থেকে ৫ এর মধ্যে হতে হবে",
      });
    }

    if (typeof comment !== "string") {
      return res.status(400).json({
        success: false,
        message: "Review comment সঠিক নয়",
      });
    }

    const trimmedComment = comment.trim();

    if (trimmedComment.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Review সর্বোচ্চ ৫০০ অক্ষরের হতে পারে",
      });
    }

    const db = await connectDB();

    const request = await db.collection("requests").findOne({
      _id: new ObjectId(requestId),
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
        message: "এই request-এর review দেওয়ার অনুমতি আপনার নেই",
      });
    }

    if (request.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "শুধু completed request-এর review দেওয়া যাবে",
      });
    }

    const existingReview = await db.collection("reviews").findOne({
      requestId: new ObjectId(requestId),
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "এই request-এর জন্য review ইতিমধ্যে দেওয়া হয়েছে",
      });
    }

    const review = {
      requestId: new ObjectId(requestId),
      userId: request.userId,
      providerId: request.providerId,
      rating: numericRating,
      comment: trimmedComment,
      createdAt: new Date(),
    };

    const result = await db.collection("reviews").insertOne(review);

    const reviewer = await db.collection("users").findOne(
      {
        _id: request.userId,
      },
      {
        projection: {
          name: 1,
        },
      }
    );

    const provider = await db.collection("users").findOne(
      {
        _id: request.providerId,
      },
      {
        projection: {
          name: 1,
        },
      }
    );

    await createUserNotification({
      userId: request.providerId,
      type: "review",
      title: "নতুন review পাওয়া গেছে",
      message: provider?.name
        ? `${provider.name}, আপনার সেবার জন্য একজন customer review দিয়েছেন।`
        : "আপনার সেবার জন্য একজন customer review দিয়েছেন।",
      requestId: request._id,
    });

    res.status(201).json({
      success: true,
      message: "Review সফলভাবে দেওয়া হয়েছে",
      review: {
        ...review,
        _id: result.insertedId,
        userName: reviewer?.name || "Customer",
      },
    });
  } catch (error) {
    console.error("Create review error:", error);

    res.status(500).json({
      success: false,
      message: "Review দিতে সমস্যা হয়েছে",
    });
  }
};

const getRequestReview = async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "সঠিক request ID দেওয়া হয়নি",
      });
    }

    const db = await connectDB();

    const request = await db.collection("requests").findOne({
      _id: new ObjectId(requestId),
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
        message: "এই review দেখার অনুমতি আপনার নেই",
      });
    }

    const review = await db.collection("reviews").findOne({
      requestId: new ObjectId(requestId),
    });

    if (!review) {
      return res.status(200).json({
        success: true,
        review: null,
      });
    }

    const reviewer = await db.collection("users").findOne(
      {
        _id: review.userId,
      },
      {
        projection: {
          name: 1,
        },
      }
    );

    res.status(200).json({
      success: true,
      review: {
        ...review,
        userName: reviewer?.name || "Customer",
      },
    });
  } catch (error) {
    console.error("Get request review error:", error);

    res.status(500).json({
      success: false,
      message: "Review-এর তথ্য আনতে সমস্যা হয়েছে",
    });
  }
};

/*
  Get all reviews of a provider
*/
const getProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params;

    if (!ObjectId.isValid(providerId)) {
      return res.status(400).json({
        success: false,
        message: "সঠিক provider ID দেওয়া হয়নি",
      });
    }

    const db = await connectDB();

    const provider = await db.collection("users").findOne(
      {
        _id: new ObjectId(providerId),
        role: "provider",
      },
      {
        projection: {
          name: 1,
        },
      }
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "সেবাদাতা পাওয়া যায়নি",
      });
    }

    const reviews = await db
      .collection("reviews")
      .aggregate([
        {
          $match: {
            providerId: new ObjectId(providerId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "reviewer",
          },
        },
        {
          $unwind: {
            path: "$reviewer",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            requestId: 1,
            providerId: 1,
            userId: 1,
            rating: 1,
            comment: 1,
            createdAt: 1,
            userName: {
              $ifNull: ["$reviewer.name", "Customer"],
            },
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ])
      .toArray();

    const totalReviews = reviews.length;

    const totalRating = reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );

    const averageRating =
      totalReviews > 0
        ? Number((totalRating / totalReviews).toFixed(1))
        : 0;

    res.status(200).json({
      success: true,
      provider: {
        _id: provider._id,
        name: provider.name,
      },
      averageRating,
      totalReviews,
      reviews,
    });
  } catch (error) {
    console.error("Get provider reviews error:", error);

    res.status(500).json({
      success: false,
      message: "সেবাদাতার review আনতে সমস্যা হয়েছে",
    });
  }
};

module.exports = {
  createReview,
  getRequestReview,
  getProviderReviews,
};