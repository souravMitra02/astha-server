
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config();
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



const connectDB = async () => {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });

    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}




module.exports = connectDB;
