const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = []; // Array to store registered users

// Function to check if user exists
const isValid = (user)=>{ //returns boolean
    let filtered_users = users.filter((user)=> user.username === user);
    if(filtered_users){
        return true;
    }
    return false;
}

// Function to autheticate a user by username and password
const authenticatedUser = (username,password)=>{ //returns boolean
    if(isValid(username)){
        let filtered_users = users.filter((user)=> (user.username===username)&&(user.password===password));
        if(filtered_users){
            return true;
        }
        return false;
       
    }
    return false;   
}

// Endpoint for user registration
regd_users.post("/register", (req,res) => {
    const username = req.body.username; // Extract username from the request body
    const password = req.body.password; // Extract password from the request body

    if (username && password) { // Ensure username and password are provided
        const present = users.filter((user) => user.username === username);
        if (present.length === 0) { // Check if the username is not already taken
            users.push({ "username": req.body.username, "password": req.body.password }); // Add new user to the users array
            return res.status(201).json({message:"USer Created successfully"}) // Success response
        }
        else{
          return res.status(400).json({message:" User already exists"}) // Username already exists
        }
    }
    else if(!username && !password){
      // Missing both username and password
      return res.status(400).json({message:"Bad request"})
    }
    else if(!username || !password){
      // Missing either username or password
      return res.status(400).json({message:"Check username and password"})
    } 
  });

// Endpoint for user login
regd_users.post("/login", (req,res) => {
    let user = req.body.username; // Extract username from the request body
    let pass = req.body.password; // Extract password from the request body
    if(!authenticatedUser(user,pass)) { // Validate the user credentials
        return res.status(403).json({message:"User not authenticated"}) // Unauthorized response
    }
    // Generate a JWT token for authenticated users
    let accessToken = jwt.sign({
        data: user
    },'access',{ expiresIn: 60*60 }) // Token expires in 1 hour
    req.session.authorization = { accessToken }; // Store the token in the session
    req.session.username = user;
    // Debugging session username
    console.log("Session Username:", req.session.username);
    res.send("User logged in successfully!") // Success response
});

regd_users.put("/auth/review/:isbn", (req, res) => {
    const username = req.session.username; // Retrieve the username from session
    const ISBN = req.params.isbn; // Extract ISBN from URL parameters
    const reviewText = req.query.review; // Extract review text from query parameters

    // Validate session
    if (!username) {
        return res.status(401).json({ message: "User not logged in or session expired" });
    }

    // Validate input
    if (!books[ISBN]) {
        return res.status(404).json({ message: "Book not found" });
    }
    if (!reviewText) {
        return res.status(400).json({ message: "Review text is required" });
    }

    // Initialize reviews object for the book if not present
    if (!books[ISBN].reviews) {
        books[ISBN].reviews = {};
    }

    // Add or update the user's review
    books[ISBN].reviews[username] = reviewText;

    // Debugging session username
    console.log("Session Username:", req.session.username);

    // Return success response with updated reviews
    return res.status(201).json({
        message: "Review added or updated successfully",
        reviews: books[ISBN].reviews, // Return all reviews for the book
    });
});

// Endpoint to delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    let ISBN = req.params.isbn; // Extract ISBN from URL parameters
    books[ISBN].reviews = {} // Delete the review by setting it to an empty object
    return res.status(200).json({messsage:"Review has been deleted"}) // Success response
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
