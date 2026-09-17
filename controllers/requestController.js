const connectDB = require("../config/db");
const { ObjectId } = require("mongodb");

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

    const service = await db
      .collection("services")
      .findOne({ _id: new ObjectId(serviceId) });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "সার্ভিসটি পাওয়া যায়নি",
      });
    }

    const newRequest = {
      serviceId: new ObjectId(serviceId),
      userId: req.user.userId,
      providerId: service.providerId,
      status: "pending",
      message,
      createdAt: new Date(),
    };

    const result = await db
      .collection("requests")
      .insertOne(newRequest);

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
      .find({ userId })
      .sort({ createdAt: -1 })
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
      .find({ providerId })
      .sort({ createdAt: -1 })
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

    if (!["accepted", "rejected"].includes(status)) {
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

    if (request.providerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "এই request পরিবর্তন করার অনুমতি আপনার নেই",
      });
    }

    const result = await db.collection("requests").updateOne(
      { _id: new ObjectId(id) },
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

module.exports = {
    createRequest,
    getMyRequests,
    getProviderRequests,
    updateRequestStatus
};