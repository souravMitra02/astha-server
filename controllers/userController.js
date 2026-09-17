const connectDB = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const registerUser = async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({
      message: "সব তথ্য দেওয়া আবশ্যক",
    });
  }

  const db = await connectDB();

  const existingUser = await db.collection("users").findOne({
    email: email,
  });

  if (existingUser) {
    return res.status(400).json({
      message: "এই email দিয়ে ইতিমধ্যে account আছে",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    name,
    email,
    password: hashedPassword,
    phone,
    role: role || "user",
    createdAt: new Date(),
  };

  const result = await db.collection("users").insertOne(newUser);

  console.log(result);

  if (result.acknowledged) {
    return res.status(201).json({
      message: "User registered successfully",
      userId: result.insertedId,
    });
  }
};


// login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "ইমেইল এবং পাসওয়ার্ড দেওয়া আবশ্যক",
    });
  }

  const db = await connectDB();

  const user = await db.collection("users").findOne({
    email: email,
  });

  if (!user) {
    return res.status(401).json({
      message: "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়",
    });
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
   return res.status(401).json({
      message: "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়",
    });
  }
  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    
    process.env.JWT_SECRET,

    {
      expiresIn: "10d",
    },
    
  );
  return res.status(200).json({
  message: "লগইন সফল হয়েছে",
  token: token,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  },
});
};

const getProfile = async (req, res) => {
  try {
    const db = await connectDB();

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(req.user.userId) },
      {
        projection: {
          password: 0,
        },
      }
    );

    if (!user) {
      return res.status(404).json({
        message: "User পাওয়া যায়নি",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      message: "Profile আনতে সমস্যা হয়েছে",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile
};
