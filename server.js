// Importing express module
const express = require('express');

// Creating an instance of express
const app = express();

// Define the port number
const PORT = 3000;

// Middleware to get client IP address
app.use((req, res, next) => {
    const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(`Access from IP: ${userIP}`);
    req.userIP = userIP;  // Storing the IP in the request object for later use
    next();
});

// Defining a simple route
app.get('/', (req, res) => {
    res.send(`Hello, this is a simple server! Your IP address is: ${req.userIP}`);
});

// Starting the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
