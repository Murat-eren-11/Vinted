const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
app.use(cors());
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI);

const userRouter = require("./routes/user");
app.use(userRouter);

const loginRouter = require("./routes/login");
app.use(loginRouter);

const offerRouter = require("./routes/offer");
app.use(offerRouter);

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist lol" });
});

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
