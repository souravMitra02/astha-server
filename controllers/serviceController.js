const connectDB = require("../config/db");
const { ObjectId } = require("mongodb");

const createService = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      price,
      location,
      latitude,
      longitude,
    } = req.body;

    if (
      !title ||
      !category ||
      !description ||
      !price ||
      !location ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "সেবার সব তথ্য দেওয়া আবশ্যক",
      });
    }

    const db = await connectDB();

    const providerId = new ObjectId(req.user.userId);

    const provider = await db.collection("users").findOne({
      _id: providerId,
    });

    if (!provider || provider.role !== "provider") {
      return res.status(403).json({
        success: false,
        message: "শুধু provider সেবা যোগ করতে পারবেন",
      });
    }

    if (provider.category !== category) {
      return res.status(400).json({
        success: false,
        message: "আপনার provider category-এর সাথে service category মিলছে না",
      });
    }

    const newService = {
      title,
      category,
      description,
      price,
      location,
      latitude,
      longitude,
      available: true,
      providerId,
      createdAt: new Date(),
    };

    const result = await db
      .collection("services")
      .insertOne(newService);

    return res.status(201).json({
      success: true,
      message: "সেবা সফলভাবে যোগ করা হয়েছে",
      serviceId: result.insertedId,
    });
  } catch (error) {
    console.error("Create service error:", error);

    return res.status(500).json({
      success: false,
      message: "সেবা যোগ করতে সমস্যা হয়েছে",
    });
  }
};

const getAllServices = async (req, res) => {
  try {
    const db = await connectDB();

    const services = await db
      .collection("services")
      .find()
      .toArray();

    return res.status(200).json({
      success: true,
      services,
    });
  } catch (error) {
    console.error("Get all services error:", error);

    return res.status(500).json({
      success: false,
      message: "সেবাগুলো আনতে সমস্যা হয়েছে",
    });
  }
};

const getSingleService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "সঠিক সার্ভিস আইডি দেওয়া হয়নি",
      });
    }

    const db = await connectDB();

    const service = await db
      .collection("services")
      .findOne({
        _id: new ObjectId(id),
      });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "সার্ভিসটি পাওয়া যায়নি",
      });
    }

    return res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("Get single service error:", error);

    return res.status(500).json({
      success: false,
      message: "সার্ভিসের তথ্য আনতে সমস্যা হয়েছে",
    });
  }
};

const findAvailableServices = async (req, res) => {
  try {
    const { category, latitude, longitude } = req.query;

    const userLatitude = Number(latitude);
    const userLongitude = Number(longitude);

    if (
      !category ||
      latitude === undefined ||
      longitude === undefined ||
      Number.isNaN(userLatitude) ||
      Number.isNaN(userLongitude)
    ) {
      return res.status(400).json({
        success: false,
        message: "Category এবং location coordinates দেওয়া আবশ্যক",
      });
    }

    const db = await connectDB();

    const services = await db
      .collection("services")
      .aggregate([
        {
          $match: {
            category,
            available: true,
            latitude: { $exists: true },
            longitude: { $exists: true },
          },
        },
        {
          $addFields: {
            distance: {
              $multiply: [
                6371,
                {
                  $acos: {
                    $add: [
                      {
                        $multiply: [
                          {
                            $sin: {
                              $degreesToRadians: userLatitude,
                            },
                          },
                          {
                            $sin: {
                              $degreesToRadians: "$latitude",
                            },
                          },
                        ],
                      },
                      {
                        $multiply: [
                          {
                            $cos: {
                              $degreesToRadians: userLatitude,
                            },
                          },
                          {
                            $cos: {
                              $degreesToRadians: "$latitude",
                            },
                          },
                          {
                            $cos: {
                              $subtract: [
                                {
                                  $degreesToRadians: "$longitude",
                                },
                                {
                                  $degreesToRadians: userLongitude,
                                },
                              ],
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
        {
          $match: {
            distance: { $lte: 10 },
          },
        },
        {
          $sort: {
            distance: 1,
          },
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
          $unwind: "$provider",
        },
        {
          $project: {
            title: 1,
            category: 1,
            description: 1,
            price: 1,
            location: 1,
            available: 1,
            providerId: 1,
            distance: 1,
            provider: {
              name: 1,
              phone: 1,
              email: 1,
              category: 1,
            },
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      success: true,
      providers: services,
    });
  } catch (error) {
    console.error("Find available services error:", error);

    return res.status(500).json({
      success: false,
      message: "Available service খুঁজতে সমস্যা হয়েছে",
    });
  }
};

const getServicesByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;

    if (!ObjectId.isValid(providerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider id",
      });
    }

    const db = await connectDB();

    const services = await db
      .collection("services")
      .find({
        providerId: new ObjectId(providerId),
      })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      services,
    });
  } catch (error) {
    console.error("Get provider services error:", error);

    return res.status(500).json({
      success: false,
      message: "Provider-এর services আনতে সমস্যা হয়েছে",
    });
  }
};

const getMyServices = async (req, res) => {
  try {
    const providerId = new ObjectId(req.user.userId);

    const db = await connectDB();

    const provider = await db.collection("users").findOne({
      _id: providerId,
    });

    if (!provider || provider.role !== "provider") {
      return res.status(403).json({
        success: false,
        message: "শুধু provider নিজের services দেখতে পারবেন",
      });
    }

    const services = await db
      .collection("services")
      .find({
        providerId,
      })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      services,
    });
  } catch (error) {
    console.error("Get my services error:", error);

    return res.status(500).json({
      success: false,
      message: "আপনার services আনতে সমস্যা হয়েছে",
    });
  }
};

const updateService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "সঠিক service ID দেওয়া হয়নি",
      });
    }

    const {
      title,
      category,
      description,
      price,
      location,
      latitude,
      longitude,
      available,
    } = req.body;

    if (
      !title ||
      !category ||
      !description ||
      !price ||
      !location ||
      latitude === undefined ||
      longitude === undefined ||
      available === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "সেবার সব তথ্য দেওয়া আবশ্যক",
      });
    }

    const db = await connectDB();

    const serviceId = new ObjectId(id);
    const providerId = new ObjectId(req.user.userId);

    const service = await db
      .collection("services")
      .findOne({
        _id: serviceId,
      });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "সার্ভিসটি পাওয়া যায়নি",
      });
    }

    if (!service.providerId.equals(providerId)) {
      return res.status(403).json({
        success: false,
        message: "আপনি এই service edit করতে পারবেন না",
      });
    }

    const provider = await db.collection("users").findOne({
      _id: providerId,
    });

    if (!provider || provider.role !== "provider") {
      return res.status(403).json({
        success: false,
        message: "শুধু provider service edit করতে পারবেন",
      });
    }

    if (provider.category !== category) {
      return res.status(400).json({
        success: false,
        message: "আপনার provider category-এর সাথে service category মিলছে না",
      });
    }

    const updateData = {
      title,
      category,
      description,
      price,
      location,
      latitude,
      longitude,
      available,
      updatedAt: new Date(),
    };

    const result = await db
      .collection("services")
      .updateOne(
        { _id: serviceId },
        { $set: updateData }
      );

    if (result.modifiedCount === 0) {
      return res.status(200).json({
        success: true,
        message: "Service-এর কোনো পরিবর্তন করা হয়নি",
      });
    }

    return res.status(200).json({
      success: true,
      message: "সেবা সফলভাবে আপডেট করা হয়েছে",
    });
  } catch (error) {
    console.error("Update service error:", error);

    return res.status(500).json({
      success: false,
      message: "সেবা আপডেট করতে সমস্যা হয়েছে",
    });
  }
};

const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "সঠিক service ID দেওয়া হয়নি",
      });
    }

    const db = await connectDB();

    const serviceId = new ObjectId(id);
    const providerId = new ObjectId(req.user.userId);

    const service = await db
      .collection("services")
      .findOne({
        _id: serviceId,
      });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "সার্ভিসটি পাওয়া যায়নি",
      });
    }

    if (!service.providerId.equals(providerId)) {
      return res.status(403).json({
        success: false,
        message: "আপনি এই service delete করতে পারবেন না",
      });
    }

    const result = await db
      .collection("services")
      .deleteOne({
        _id: serviceId,
      });

    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "সার্ভিসটি delete করা যায়নি",
      });
    }

    return res.status(200).json({
      success: true,
      message: "সেবা সফলভাবে delete করা হয়েছে",
    });
  } catch (error) {
    console.error("Delete service error:", error);

    return res.status(500).json({
      success: false,
      message: "সেবা delete করতে সমস্যা হয়েছে",
    });
  }
};

module.exports = {
  createService,
  getAllServices,
  getSingleService,
  findAvailableServices,
  getServicesByProvider,
  getMyServices,
  updateService,
  deleteService,
};