require('dotenv').config();
let express = require('express');
let app = express();

/* -------------------------------------------------------------------------- */
/*                              QUICKMONGO SETUP                              */
/* -------------------------------------------------------------------------- */

const { Database } = require("quickmongo"); 
const db = new Database(process.env.MONGODB_URI);

// Connect to the termud
db.on("ready", () => {
    console.log("MongoDB connected");
});

db.on("error", (err) => {
    console.error("connection error:", err);
});

db.connect();

app.use('/', express.static('public'));
app.use(express.json());


// /* --------------------- TEMPORARY: DATABASE RESET ROUTE -------------------- */


// app.get('/reset', async (req, res) => {
//     try {
//         // This deletes EVERYTHING in the submissions collection
//         await db.delete('submissions');
//         console.log("Database cleared!");
//         res.send("Database has been reset. All ghosts are gone.");
//     } catch (error) {
//         res.status(500).send("Error clearing database: " + error);
//     }
// });

// -------------------------------------------------------------------------- //
//                                 POST ROUTE                                 //
// -------------------------------------------------------------------------- //

// RECEIVE DATA FROM SUBMISSION FORM
app.post('/submit', async (request, response) => {
    let submissionData = request.body;
    
    // Create the object with the data pairs
    let obj = {
        name: submissionData.name,
        role: submissionData.role,
        note: submissionData.note,
        song: submissionData.song,
        hide: submissionData.hide, // This will be a boolean
        timestamp: new Date()
    };
    
try {
        // SAVE TO DATABASE: 'push' the object into a collection named 'submissions'
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
        // FROM DATABASE: Fetch the submissions array
        let allSubmissions = await db.get('submissions');

        // If the database is empty, allSubmissions might be null. If so, default to an empty array.
        if (!allSubmissions) {
            allSubmissions = [];
        }

        // FILTER REDACTED NAMES
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