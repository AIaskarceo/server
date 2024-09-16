// Importing express module
const express = require('express');

// Creating an instance of express
const app = express();

// Define the port number
const PORT = 3000;

// Array to store all user IP addresses
let userIPs = [];

// Middleware to get client IP address
app.use((req, res, next) => {
    const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // If the IP is not already in the list, add it
    if (!userIPs.includes(userIP)) {
        userIPs.push(userIP);
    }

    console.log(`Access from IP: ${userIP}`);
    req.userIP = userIP;  // Storing the IP in the request object for later use
    next();
});

// Defining a simple route
app.get('/', (req, res) => {
    // Display all users' IP addresses on the webpage
    const allIPs = userIPs.map(ip => `<li>${ip}</li>`).join('');
    res.send(`
        <h1>Hello, this is a simple server!</h1>
        <p>Your IP address is: ${req.userIP}</p>
        <h2>All Users' IP Addresses:</h2>
        <ul>${allIPs}</ul>
    `);
});

// Starting the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
