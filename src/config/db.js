import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // if (!process.env.MONGO_URL) {
    //   console.log(process.env.MONGO_URL);
    //   throw new Error("MONGO_URL is not defined in environment variables");
    // }
    await mongoose.connect("mongodb+srv://np03cs4a230066_db_user:iwFgzN1MKWoYIhGL@cluster0.r9xxpgb.mongodb.net/?appName=Cluster0");
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.log("MongoDB connection failed");
    console.error(err);
    process.exit(1);
  }
};