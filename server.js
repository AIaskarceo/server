// Importing express module
const express = require('express');

// Creating an instance of express
const app = express();

// Define the port number
const PORT = 3000;

// Defining a simple route
app.get('/', (req, res) => {
    res.send('Hello, this is a simple server!');
});

// Starting the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
