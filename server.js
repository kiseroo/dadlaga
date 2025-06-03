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

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'test' && password === 'test123') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid' });
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

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('SIGINT', async () => {
    await client.close();
    console.log('Mongodb conn closed');
    process.exit(0);
});
