const dotenv = require('dotenv');
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const cors = require('cors');
const Razorpay = require('razorpay');
dotenv.config({ path: './config.env' });
const PORT = process.env.PORT;
var instance = new Razorpay({ key_id:  process.env.KEY, key_secret: process.env.SECRET })


require('./conn');
//const User = require('./model/userSchema');
app.use(cors())
app.use(express.json());

app.use(require('./auth'));





app.get('/features', (req, res) => {
    res.send('Hello world features');
});

app.get('/pricing', (req, res) => {
    res.send('Hello world pricing');
});

/* 
app.get('/chatbot', (req, res) => {
    console.log("hello about");
    res.send('Hello world chatbot');
}); */

app.get('/signin', (req, res) => {
    res.send('Hello world signin');
});

app.get('/signup', (req, res) => {
    res.send('Hello world signup');
});

app.listen(PORT, () => {
    console.log(`server is running at port no. ${PORT}`)
});