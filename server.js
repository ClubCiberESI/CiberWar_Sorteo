// Simple Express server to serve static files and provide API for participants

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'participants.json');

app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/participants', (req, res) => {
    fs.readFile(DATA_PATH, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading participants.json', err);
            return res.status(500).json([]);
        }
        try {
            const json = JSON.parse(data);
            res.json(json);
        } catch (parseErr) {
            console.error('Parse error', parseErr);
            res.status(500).json([]);
        }
    });
});

app.put('/api/participants', (req, res) => {
    const participants = req.body;
    fs.writeFile(DATA_PATH, JSON.stringify(participants, null, 2), err => {
        if (err) {
            console.error('Error writing participants.json', err);
            return res.status(500).send('Failed to save');
        }
        res.sendStatus(200);
    });
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});