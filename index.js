const express = require('express');
const app = express();
const connectDB = require("./config/db");
const { MongoClient } = require('mongodb');
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});




connectDB()


app.listen(port,() => {
  console.log(`Example app listening on port ${port}`);
});