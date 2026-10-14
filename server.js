const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const MONGO_URI = process.env.MONGO_URI || 'YOUR_MONGODB_CONNECTION_STRING';

mongoose.connect(MONGO_URI)
.then(() => console.log('Database Connected'))
.catch(err => console.log(err));

const librarySchema = new mongoose.Schema({
    board: String,
    className: String,
    subject: String,
    book: String,
    pdfData: Object
});

const LibraryItem = mongoose.model('LibraryItem', librarySchema);

app.get('/api/library', async (req, res) => {
    try {
        const items = await LibraryItem.find();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/library', async (req, res) => {
    try {
        const newItem = new LibraryItem(req.body);
        await newItem.save();
        res.status(201).json({ message: 'Saved successfully', item: newItem });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
