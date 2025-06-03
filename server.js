const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://test:test123@cluster0.agtvxla.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

const app = express();
app.use(cors());
app.use(express.json());

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("Connected to Mongodb");
        
        const database = client.db("test");
        console.log("successfully");
        
        return database;
    } catch (error) {
        console.error("Error", error);
        throw error;
    }
}

let db;
connectToMongoDB()
    .then(database => {
        db = database;
    })
    .catch(console.error);

app.post('/api/login', async (req, res) => {
    try {
        // Accept both name and username parameters for backward compatibility
        const name = req.body.name || req.body.username;
        const { password } = req.body;
        
        console.log('Login attempt:', { name, password }); // For debugging
        
        const collection = db.collection('users');
        const user = await collection.findOne({ name });
        
        console.log('User found:', user); // For debugging
        
        if (!user || user.password !== password) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }
        
        const userData = { ...user };
        delete userData.password;
        
        res.json({ 
            success: true,
            message: 'Login successful',
            user: userData
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error during login',
            error: error.message
        });
    }
});

app.post('/api/test-data', async (req, res) => {
    try {
        const collection = db.collection('test_collection');
        const result = await collection.insertOne({
            name: 'Test Document',
            date: new Date(),
            info: 'test doc'
        });
        
        res.json({ 
            success: true, 
            message: 'Test data inserted successfully', 
            documentId: result.insertedId 
        });
    } catch (error) {
        console.error('Error inserting test data:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to insert test data',
            error: error.message 
        });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const collection = db.collection('users');
        
        // Accept both name and username parameters
        const userName = req.body.name || req.body.username;
        
        const existingUser = await collection.findOne({ name: userName });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this name already exists'
            });
        }
        
        const newUser = {
            name: userName,
            password: req.body.password, 
            createdAt: new Date()
        };
        
        const result = await collection.insertOne(newUser);
        
        const userResponse = {...newUser};
        delete userResponse.password;
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            userId: result.insertedId,
            user: userResponse
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: error.message
        });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const collection = db.collection('users');
        const users = await collection.find({}).toArray();
        
        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const collection = db.collection('users');
        const { ObjectId } = require('mongodb');
        
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        
        const user = await collection.findOne({ _id: new ObjectId(req.params.id) });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: error.message
        });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const collection = db.collection('users');
        const { ObjectId } = require('mongodb');
        
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        
        const updateData = {
            name: req.body.name,
            password: req.body.password,
            updatedAt: new Date()
        };
        
        const result = await collection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User updated successfully',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const collection = db.collection('users');
        const { ObjectId } = require('mongodb');
        
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        
        const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('SIGINT', async () => {
    await client.close();
    console.log('Mongodb conn closed');
    process.exit(0);
});


//13:10