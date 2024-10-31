const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config(); // Load environment variables

const app = express();
const port = process.env.PORT || 3000;

// MongoDB URI from environment variable
const uri = process.env.MONGODB_URI; // Load from environment variable
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Middleware to parse JSON
app.use(express.json());

// Connect to MongoDB
async function connectToDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

connectToDB();

// Optimized helper function to generate sub-phrases
function generateSubPhrases(message) {
    const words = message.split(" ");
    const subPhrases = [];

    for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j <= words.length; j++) {
            subPhrases.push(words.slice(i, j).join(" "));
        }
    }

    // Prioritize longer sub-phrases by sorting them in descending order
    return subPhrases.sort((a, b) => b.length - a.length);
}

// Define a GET endpoint to fetch replies based on user input
app.get('/api/reply/:message', async (req, res) => {
    try {
        const message = req.params.message.trim();
        const db = client.db("Nilou-Chatbot");

        // Generate all possible sub-phrases of the message
        const subPhrases = generateSubPhrases(message);

        // Check each sub-phrase in MongoDB
        for (const phrase of subPhrases) {
            const responseMsg = await db.collection('nilou').findOne({ message: { $regex: `^${phrase}$`, $options: 'i' } });
            if (responseMsg && responseMsg.replies && responseMsg.replies.length > 0) {
                const randomReply = responseMsg.replies[Math.floor(Math.random() * responseMsg.replies.length)];
                return res.json({ reply: randomReply });
            }
        }

        // If no match found, return the default response
        res.json({ reply: "Kindly teach me ! 😿" });
    } catch (error) {
        console.error('Failed to fetch reply:', error);
        res.status(500).json({ error: 'Failed to fetch reply', details: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
