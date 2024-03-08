const express = require("express");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/Vinted");

const userRouter = require("./routes/user");
app.use(userRouter);

const loginRouter = require("./routes/login");
app.use(loginRouter);

const offerRouter = require("./routes/offer");
app.use(offerRouter);

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist lol" });
});

app.listen(3000, () => {
  console.log("Server started");
});
