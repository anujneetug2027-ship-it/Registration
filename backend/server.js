// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const db = require('./db'); // connect DB
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());
app.use(bodyParser.json());

// EmailJS config
const EMAIL_SERVICE = "service_h2opout";
const EMAIL_TEMPLATE = "template_vepoizn";
const EMAIL_PUBLIC_KEY = "nrRHkmrcj0okGAbI2";
const EMAIL_PRIVATE_KEY = "Sbl6IqF6DjELH6KuGucIu";

// Helper: send verification email
async function sendEmail(email, code) {
    try {
        const url = "https://api.emailjs.com/api/v1.0/email/send";
        const body = {
            service_id: EMAIL_SERVICE,
            template_id: EMAIL_TEMPLATE,
            user_id: EMAIL_PUBLIC_KEY,       // public key
            accessToken: EMAIL_PRIVATE_KEY,  // private key for strict mode
            template_params: {
                email: email,               // matches {{email}}
                passcode: code,             // matches {{passcode}}
                time: new Date().toLocaleString() // matches {{time}}
            }
        };

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.text();
        console.log("EmailJS response:", data);

        if (!res.ok) {
            throw new Error(`Failed to send email: ${data}`);
        }

        return true;
    } catch (err) {
        console.error("sendEmail error:", err.message);
        return false;
    }
}

// Register route
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).send("Email already registered");

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const user = new User({
            name,
            email,
            password: hashedPassword,
            verificationCode
        });

        await user.save();

        const emailSent = await sendEmail(email, verificationCode);
        if (!emailSent) return res.status(500).send("Failed to send verification email");

        res.send("Registered! Verification email sent.");
    } catch (err) {
        res.status(500).send("Server error: " + err.message);
    }
});

// Verify email route
app.post('/verify', async (req, res) => {
    const { email, code } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).send("User not found");

        if (user.verificationCode === code) {
            user.verified = true;
            await user.save();
            res.send("Email verified! You can now login.");
        } else {
            res.status(400).send("Invalid verification code");
        }
    } catch (err) {
        res.status(500).send("Server error: " + err.message);
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).send("User not found");
        if (!user.verified) return res.status(400).send("Email not verified");

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).send("Wrong password");

        res.send(`Welcome ${user.name}!`);
    } catch (err) {
        res.status(500).send("Server error: " + err.message);
    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
