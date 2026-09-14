
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
  await client.connect();

const db = client.db("admin");

await db.command({ ping: 1 });

console.log("MongoDB connected successfully!");

return db;
}




module.exports = connectDB;
