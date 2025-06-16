const mongoose = require('mongoose');

// Add multiple connection options for flexibility
const uri = process.env.MONGODB_URI || "mongodb+srv://test:test123@cluster0.agtvxla.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";

// Fallback to local MongoDB if Atlas connection fails
const localUri = "mongodb://localhost:27017/test";

const connectToMongoDB = async () => {
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000, 
            socketTimeoutMS: 45000,
        });
        console.log("Connected to MongoDB Atlas with Mongoose");
        return true;
    } catch (atlasError) {
        console.warn("Could not connect to MongoDB Atlas:", atlasError.message);
        console.log("Trying to connect to local MongoDB instance...");
        
        try {
            await mongoose.connect(localUri, {
                serverSelectionTimeoutMS: 5000
            });
            console.log("Connected to local MongoDB with Mongoose");
            return true;
        } catch (localError) {
            console.error("Error connecting to both MongoDB Atlas and local instance:", localError);
            throw localError;
        }
    }
};

module.exports = connectToMongoDB;