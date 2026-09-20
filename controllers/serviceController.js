const connectDB = require("../config/db");
const { ObjectId } = require("mongodb");

const createService = async (req, res) => {
  const { title, category, description, price, location } = req.body;

  if (!title || !category || !description || !price || !location) {
    return res.status(400).json({
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
      message: "শুধু provider সেবা যোগ করতে পারবেন",
    });
  }

  if (provider.category !== category) {
    return res.status(400).json({
      message: "আপনার provider category-এর সাথে service category মিলছে না",
    });
  }

  const newService = {
    title,
    category,
    description,
    price,
    location,
    available: true,
    providerId,
    createdAt: new Date(),
  };

  const result = await db.collection("services").insertOne(newService);

  if (result.acknowledged) {
    return res.status(201).json({
      message: "সেবা সফলভাবে যোগ করা হয়েছে",
      serviceId: result.insertedId,
    });
  }
};

const getAllServices = async (req, res) => {
    try {
      const db = await connectDB();
    const services = await db.collection("services").find().toArray();

    res.status(200).json({
      success: true,
      services,
    });
  } catch (error) {
    console.error("Get all services error:", error);

    res.status(500).json({
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
      .findOne({ _id: new ObjectId(id) });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "সার্ভিসটি পাওয়া যায়নি",
      });
    }

    res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("Get single service error:", error);

    res.status(500).json({
      success: false,
      message: "সার্ভিসের তথ্য আনতে সমস্যা হয়েছে",
    });
  }
};




module.exports = {
    createService,
    getAllServices,
    getSingleService
};