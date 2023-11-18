const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const authenticate = require("../middleware/authenticate");
dotenv.config({ path: './config.env' });
const Razorpay = require('razorpay');

var instance =  new Razorpay({ key_id:  process.env.KEY, key_secret: process.env.SECRET })
require('../db/conn');
const User = require("../model/UserSchema");

router.get('/', (req, res) => {
    res.send('Hello world r');
});

router.post('/register', async (req, res) => {

    const { name, email, phone, password, cpassword } = req.body;

    if (!name || !email || !phone || !password || !cpassword) {
        return res.status(422).json({ error: "Please fill the field Properly" });
    }

    try {

        const userExist = await User.findOne({ email: email })
        if (userExist) {
            return res.status(422).json({ error: "Email already exist" });
        } else if (password != cpassword) {
            return res.status(422).json({ error: "Password are not matching" });
        } else {
            const user = new User({ name, email, phone, password, cpassword });
            await user.save();
            return res.status(201).json({ message: "user registerd successfuly" });
        }

    } catch (err) {
        console.log(err);
    }

});
/* User.findOne({ email: email })
.then((userExist) => {
    if (userExist) {
        return res.status(422).json({ error: "Email already exist" });
    }

    const user = new User({ name, email, phone, password, cpassword });

    user.save().then(() => {
        res.status(201).json({ message: "user registerd successfuly" });
    }).catch((err) => res.status(500).json({ error: "Failed to register" }));
 
}).catch(err => { console.log(err); });*/


//login route
router.post('/signin', async (req, res) => {
    try {
        let token;
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Please fill the data" })
        }

        const userLogin = await User.findOne({ email: email });

        // console.log(userLogin);

        if (userLogin) {
            const isMatch = await bcrypt.compare(password, userLogin.password);

            token = await userLogin.generateAuthToken();
            console.log(token);

            res.cookie("jwtoken", token, {
                expires: new Date(Date.now() + 25892000000),
                httpOnly: true
            });



            if (!isMatch) {
                res.status(400).json({ error: "Invalid Credientials p" });
            } else {
                res.json({ message: "User Signin Successful" });
            }
        } else {
            res.status(400).json({ error: "Invalid Credientials" });
        }


    } catch (err) {
        console.log(err);

    }
});

const cookieParser = require("cookie-parser");
router.use(cookieParser());

router.get('/chatbot', authenticate, (req, res) => {
    console.log("hello cb");
    res.send(req.rootUser);
});


router.get('/getdata', authenticate, (req, res) => {
    console.log("hello gd");
    res.send(req.rootUser);
});

router.get('/logout', (req, res) => {
    console.log("hello logout");
    res.clearCookie('jwtoken', { path: '/' });
    res.status(200).send('User Logout');
});

router.post('/check', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email and password
        const user = await User.findOne({ email, password });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // If user is found, return the "member" field
        res.json({ member: user.member });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post('/incrementCount', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user by email and password
        const user = await User.findOne({ email, password });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Increment the count field
        user.count += 1;

        // Save the updated user
        await user.save();

        res.json({ message: "Count incremented successfully", newCount: user.count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post('/payment', (req, res) => {

    var options = {
        amount: 50000,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "order_rcptid_11"
    };
    instance.orders.create(options, function (err, order) {
        res.send(order);
    });

});


router.post("/verify", authenticate, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
            req.body;
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", "ngKB4DX2x0ZOMWGbUR7GMGlb")
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Payment verified successfully

            const email = req.rootUser.email;
            const password = req.rootUser.password;


            // Find the user by email and password
            const user = await User.findOne({ email, password });

            if (!user) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            // Update the member field to "paid"
            user.member = "paid";

            // Save the updated user
            await user.save();

            return res.status(200).json({ message: "Payment verified successfully. Member status updated to paid." });
        } else {
            return res.status(400).json({ message: "Invalid signature sent!" });
        }
    } catch (error) {
        const email = req.rootUser.email;
        const password = req.rootUser.password;

        // Find the user by email and password
        const user = await User.findOne({ email, password });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Update the member field to "paid"
        user.member = "paid";

        // Save the updated user
        await user.save();

        res.status(500).json({ message: "Internal Server Error!" });
        console.log(error);
    }
});


module.exports = router;