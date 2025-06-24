const express = require('express');
const cors = require('cors');
const connectToMongoDB = require('./config/database');
const userRoutes = require('./routes/users');
const sambarRoutes = require('./routes/sambar');
const shonRoutes = require('./routes/shon');
const districtRoutes = require('./routes/districts');
const lineRoutes = require('./routes/lines');
const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/sambar', sambarRoutes);
app.use('/api/shon', shonRoutes);
app.use('/api/districts', districtRoutes);
app.use('/api/lines', lineRoutes);

connectToMongoDB().catch(console.error);

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;