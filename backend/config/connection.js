import mongoose from "mongoose";

export const mdbConnection = async () => {
    try {
        const conn = await mongoose.connect(process.env?.MONGO_URI)
            .then((conn) => console.log('MongoDB connected: ', conn.connection.host))
            .catch(err => {
                console.error('MongoDB connection failed:', err.message);
                process.exit(1); 
            });
            
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); 
    }
} 