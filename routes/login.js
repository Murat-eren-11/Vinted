const express = require("express");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const router = express.Router();

const User = require("../models/User");

router.post("/user/login", async (req, res) => {
  try {
    console.log(req.body);
    const userFound = await User.findOne({ email: req.body.email });

    if (!userFound) {
      return res.status(404).json({ message: "User not found" });
    }

    const hash = SHA256(req.body.password + userFound.salt).toString(encBase64);
    if (hash !== userFound.hash) {
      return res.status(401).json({ message: "Password incorrect" });
    }
    res.status(200).json({
      message: "Connecté",
      username: userFound.account.username,
      token: userFound.token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
