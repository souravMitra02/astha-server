const express = require('express');
const app = express();
const cors = require('cors');
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const requestRoutes = require("./routes/requestRoutes");
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);


app.use("/api/services", serviceRoutes);
app.use("/api/requests", requestRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});




connectDB()


app.listen(port,() => {
  console.log(`Example app listening on port ${port}`);
});