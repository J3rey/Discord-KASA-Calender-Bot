const mongoose = require("mongoose");

class DatabaseConnection {
  constructor() {
    this.isConnecting = false;
    this.setupEventHandlers();
  }

  async connect() {
    if (this.isConnecting || mongoose.connection.readyState === 1) {
      return true;
    }

    this.isConnecting = true;

    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        bufferCommands: false,
        maxPoolSize: 10,
        serverApi: {
          version: "1",
          strict: true,
          deprecationErrors: true,
        },
      });
      console.log("Connected to MongoDB");
      return true;
    } catch (error) {
      console.error("MongoDB connection error:", error);
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  setupEventHandlers() {
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected. Attempting to reconnect...");
      setTimeout(() => this.connect(), 5000);
    });
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  async disconnect() {
    await mongoose.connection.close();
  }
}

module.exports = new DatabaseConnection();
