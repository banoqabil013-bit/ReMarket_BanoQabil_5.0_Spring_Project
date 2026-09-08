const Category = require("./models/Category");

const defaultCategories = [
  "Mobiles",
  "Vehicles",
  "Property for Sale",
  "Property for Rent",
  "Electronics & Appliances",
  "Bikes & Motorcycles",
  "Business & Agriculture",
  "Services",
  "Jobs",
  "Animals & Pets",
  "Furniture & Decor",
  "Fashion & Beauty",
  "Books & Sports",
  "Kids & Baby",
];

const seedDefaultCategories = async () => {
  try {
    for (const name of defaultCategories) {
      const exists = await Category.findOne({ name });
      if (!exists) {
        await Category.create({
          name,
          icon: null,
          status: "active",
        });
      }
    }

    console.log("All OLX categories synced successfully");
  } catch (error) {
    console.error("Category seeding failed:", error.message);
  }
};

module.exports = seedDefaultCategories;
