const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
        email: { type: String, unique: true },
            password: String,
                verified: { type: Boolean, default: false },
                    verificationCode: String
                    });

                    module.exports = mongoose.model('User', userSchema);