const dns = require("dns");
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI?.trim();

    if (!mongoUri) {
      throw new Error("MONGO_URI is not configured");
    }

    const dnsServers = process.env.MONGO_DNS_SERVERS
      ?.split(",")
      .map((server) => server.trim())
      .filter(Boolean);

    if (dnsServers?.length) {
      dns.setServers(dnsServers);
    }

    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`, {
      cause: error,
    });
  }
};

// const connectDB = () => {
//   mongoose.connect(process.env.MONGO_URI).then(() => {
//     console.log('MongoDB connected');
//   }).catch((error) => {
//     console.error('Error connecting to MongoDB:', error);
//     process.exit(1);
//   });
// }

// async function connectDB() {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log('MongoDB connected');
//   } catch (error) {
//     console.error('Error connecting to MongoDB:', error);
//     process.exit(1);
//   }
// }

module.exports = connectDB;

