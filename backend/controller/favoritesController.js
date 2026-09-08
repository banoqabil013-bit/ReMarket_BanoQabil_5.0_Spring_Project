const Favorite = require("../models/Favorite");
const Ad = require("../models/Ads");

// ========================================
// TOGGLE FAVORITE (add or remove)
// ========================================
const toggleFavorite = async (req, res) => {
  try {
    const { adId } = req.params;
    const userId = req.user._id;

    // Check ad exists and is active or sold
    const ad = await Ad.findById(adId);
    if (!ad || !["active", "sold"].includes(ad.status)) {
      return res.status(404).json({ success: false, message: "Ad not found" });
    }

    // Check if already favorited
    const existing = await Favorite.findOne({ user: userId, ad: adId });

    if (existing) {
      // Remove favorite
      await Favorite.deleteOne({ _id: existing._id });
      return res.status(200).json({ success: true, favorited: false, message: "Removed from favorites" });
    } else {
      // Add favorite
      await Favorite.create({ user: userId, ad: adId });
      return res.status(201).json({ success: true, favorited: true, message: "Added to favorites" });
    }
  } catch (error) {
    console.error("Toggle Favorite Error:", error);
    return res.status(500).json({ success: false, message: "Failed to toggle favorite", error: error.message });
  }
};

// ========================================
// GET MY FAVORITES
// ========================================
const getMyFavorites = async (req, res) => {
  try {
    const userId = req.user._id;

    const favorites = await Favorite.find({ user: userId })
      .populate({
        path: "ad",
        populate: [
          { path: "user", select: "name email phone city profileImage isVerified" },
          { path: "category", select: "name" },
        ],
      })
      .sort({ createdAt: -1 });

    // Filter out deleted/inactive ads (keep active and sold)
    const activeAds = favorites
      .filter((fav) => fav.ad && ["active", "sold"].includes(fav.ad.status))
      .map((fav) => ({ ...fav.ad.toObject(), favoriteId: fav._id }));

    return res.status(200).json({ success: true, count: activeAds.length, ads: activeAds });
  } catch (error) {
    console.error("Get Favorites Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch favorites", error: error.message });
  }
};

// ========================================
// GET FAVORITED AD IDs for a user (for heart states on listing pages)
// ========================================
const getMyFavoriteIds = async (req, res) => {
  try {
    const userId = req.user._id;
    const favorites = await Favorite.find({ user: userId }).select("ad");
    const ids = favorites.map((f) => f.ad.toString());
    return res.status(200).json({ success: true, ids });
  } catch (error) {
    console.error("Get Favorite IDs Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch favorite IDs", error: error.message });
  }
};

module.exports = { toggleFavorite, getMyFavorites, getMyFavoriteIds };
