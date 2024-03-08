const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");

const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middleware/isAuthenticated");
const convertToBase64 = require("../utils/convertToBase64");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const Offer = require("../models/Offer");

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload("pictures"),
  async (req, res) => {
    try {
      const cloudinaryResponses = await Promise.all(
        req.files.map(async (picture) => {
          const cloudinaryResponse = await cloudinary.uploader.upload(
            convertToBase64(picture)
          );
          return cloudinaryResponse; // Stockez la réponse de Cloudinary
        })
      );
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      if (title.length > 50) {
        return res.json({ message: "Nom trop long" });
      }
      if (description.length > 500) {
        return res.json({ message: "Description trop longue" });
      }
      if (price > 100000) {
        return res.json({ message: "Calme toi pablo" });
      }

      //const picture = req.files.picture;
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ÉTAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
        product_image: cloudinaryResponses,
        owner: req.user,
      });
      await newOffer.save();
      res.status(200).json(newOffer);
    } catch (error) {
      res.json({ error: error.message });
    }
  }
);

router.put("/offer/modify/:id", isAuthenticated, async (req, res) => {
  try {
    const offerToModify = await Offer.findById(req.params.id);

    if (!offerToModify) {
      return res.status(404).json({ message: "Offre non trouvée" });
    }

    if (req.body.product_name) {
      offerToModify.product_name = req.body.product_name;
    }
    if (req.body.product_description) {
      offerToModify.product_description = req.body.product_description;
    }
    if (req.body.product_price) {
      offerToModify.product_price = req.body.product_price;
    }

    await offerToModify.save();

    res
      .status(200)
      .json({ message: "Offre modifiée avec succès", offer: offerToModify });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
  try {
    const offerId = req.params.id;
    const offerToDelete = await Offer.findByIdAndDelete(offerId);

    if (!offerToDelete) {
      return res.status(404).json({
        message: "L'offre n'a pas été trouvée ou a déjà été supprimée",
      });
    }

    res.json({
      message: "L'offre a été supprimée avec succès",
      deletedOffer: offerToDelete,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    let query = {};
    let page = parseInt(req.query.page) || 1;
    let perPage = 10;

    if (req.query.title) {
      query.product_name = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMin || req.query.priceMax) {
      query.product_price = {};
      if (req.query.priceMin) {
        query.product_price.$gte = parseInt(req.query.priceMin);
      }
      if (req.query.priceMax) {
        query.product_price.$lte = parseInt(req.query.priceMax);
      }
    }

    const offers = await Offer.find(query)
      .sort(
        req.query.sort === "price-desc"
          ? { product_price: "desc" }
          : { product_price: "asc" }
      )
      .skip((page - 1) * perPage)
      .limit(perPage)
      .select("product_price product_name");

    const totalOffers = await Offer.countDocuments(query);

    res.json({ offers, totalOffers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;

router.get("/offers/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).select(
      "product_name product_price"
    );

    if (!offer) {
      return res.status(404).json({ message: "Annonce non trouvée" });
    }

    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
