const jwt = require("jsonwebtoken");

const generateAdActionToken = (adId, action) => {
  return jwt.sign({ adId, action }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const verifyAdActionToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateAdActionToken, verifyAdActionToken };
