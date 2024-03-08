const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

const User = require("../models/User");

router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    const convertedFile = convertToBase64(req.files.picture);
    const uploadResult = await cloudinary.uploader.upload(convertedFile, {
      folder: "vinted/avatar",
    });
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(500).json({ message: "Email already exists" });
    }
    if (!req.body.username) {
      return res.status(300).json({ message: "Username required" });
    }

    const salt = uid2(16);
    const hash = SHA256(req.body.password + salt).toString(encBase64);
    const token = uid2(64);
    const newUser = new User({
      email: req.body.email,
      account: {
        username: req.body.username,
        avatar: uploadResult,
      },
      newsletter: req.body.newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });
    await newUser.save();
    res.json("Compte créé avec succès " + newUser.account.username);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
