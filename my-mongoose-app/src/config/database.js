const mongoose = require('mongoose');

const uri = "mongodb+srv://test:test123@cluster0.agtvxla.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";

const connectToMongoDB = async () => {
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000, 
            socketTimeoutMS: 45000,         
        });
        console.log("Connected to MongoDB with Mongoose");
        return true;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
};

module.exports = connectToMongoDB;