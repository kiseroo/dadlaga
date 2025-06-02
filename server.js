const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'test' && password === 'test123') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
