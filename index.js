const express = require('express');
const app = express();
const connectDB = require("./config/db");
const { MongoClient } = require('mongodb');
const userRoutes = require("./routes/userRoutes");
const port = process.env.PORT || 3000;


app.use(express.json());
app.use("/api/users", userRoutes);



app.get('/', (req, res) => {
  res.send('Hello World!');
});




connectDB()


app.listen(port,() => {
  console.log(`Example app listening on port ${port}`);
});