import mongoose from "mongoose";

export const mdbConnection = async () => {
    try {
        const conn = await mongoose.connect(process.env?.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${e.message}`);
        process.exit(1); 
    }
} 