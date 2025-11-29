require('dotenv').config();
let express = require('express');
let app = express();

// 1. SETUP QUICKMONGO
const { Database } = require("quickmongo");
const db = new Database(process.env.MONGODB_URI);

// Connect to the Cloud
db.on("ready", () => {
    console.log("✅ Connected to MongoDB Cloud successfully!");
});

db.on("error", (err) => {
    console.error("❌ Database connection error:", err);
});

db.connect();

// Middleware
app.use('/', express.static('public'));
app.use(express.json());

// -------------------------------------------------------------------------- //
//                                 POST ROUTE                                 //
// -------------------------------------------------------------------------- //

// Notice the 'async' keyword here. We need it to use 'await' inside.
app.post('/submit', async (request, response) => {
    let submissionData = request.body;
    
    // Create the object
    let obj = {
        name: submissionData.name,
        role: submissionData.role,
        note: submissionData.note,
        song: submissionData.song,
        hide: submissionData.hide, // Boolean (true/false)
        timestamp: new Date()
    };
    
try {
        // 2. SAVE TO DATABASE
        // We 'push' the object into a collection named 'submissions'
        // 'await' means: Wait for this to finish before moving on.
        await db.push('submissions', obj);

        console.log('New submission saved to cloud:', obj);
        response.json({ status: 'success', message: 'Submission received!' });

    } catch (error) {
        console.error('Database error:', error);
        response.json({ status: 'error', message: 'Failed to save submission' });
    }
});

// -------------------------------------------------------------------------- //
//                                  GET ROUTE                                 //
// -------------------------------------------------------------------------- //

app.get('/submissions', async (request, response) => {
    try {
        // 3. GET FROM DATABASE
        // Fetch the entire array stored under the name 'submissions'
        let allSubmissions = await db.get('submissions');

        // If the database is empty (first time running), allSubmissions might be null.
        // We default to an empty array [] to prevent crashing.
        if (!allSubmissions) {
            allSubmissions = [];
        }

        // 4. FILTER REDACTED NAMES
        // We process the data exactly like you did before
        let filteredDocs = allSubmissions.map(doc => {
            if (doc.hide === true) {
                return { ...doc, name: '[redacted]' };
            }
            return doc;
        });
        
        // Send it to the frontend
        response.json({ status: 'success', data: filteredDocs });

    } catch (error) {
        console.error('Database error:', error);
        response.json({ status: 'error', data: [] });
    }
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:3000`);
});