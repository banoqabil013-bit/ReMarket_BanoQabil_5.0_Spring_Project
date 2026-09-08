const express = require("express");
const { toggleFavorite, getMyFavorites, getMyFavoriteIds } = require("../controller/favoritesController");
const auth = require("../middleware/auth");

const router = express.Router();

// All favorites routes require authentication
router.post("/:adId", auth, toggleFavorite);
router.get("/", auth, getMyFavorites);
router.get("/ids", auth, getMyFavoriteIds);

module.exports = router;
