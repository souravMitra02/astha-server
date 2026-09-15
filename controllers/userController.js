const connectDB = require("../config/db");
const bcrypt = require("bcrypt");
const registerUser = async (req, res) => {
  const { name, email, password, phone } = req.body;
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
    role: "user",
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
  res.status(401).json({
    message: "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়",
  });
}

};

module.exports = {
  registerUser,
  loginUser
};
