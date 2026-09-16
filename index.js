const express = require('express');
const app = express();
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const port = process.env.PORT || 3000;


app.use(express.json());
app.use("/api/users", userRoutes);


app.use("/api/services", serviceRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});




connectDB()


app.listen(port,() => {
  console.log(`Example app listening on port ${port}`);
});