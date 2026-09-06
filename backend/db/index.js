const dns = require("dns");
const mongoose = require("mongoose");

// Windows/local DNS often refuses SRV lookups used by mongodb+srv:// URIs.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
  const connectionString = process.env.MONGO_URI

  if (!connectionString) {
    throw new Error("MONGODB_URI is missing from the backend environment");
  }

  const conn = await mongoose.connect(connectionString, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB Connected: ${conn.connection.host}`);
  return conn;
};

module.exports = connectDB;
