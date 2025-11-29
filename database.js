const Datastore = require('nedb');

// Create a database file called 'submissions.db' in your project folder
const db = new Datastore({ 
    filename: './submissions.db',  // This is where data will be saved
    autoload: true                  // Automatically load the database on startup
});

module.exports = db;
