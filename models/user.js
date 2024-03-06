const mongoose = require('mongoose');

const validator = require("validator");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validator(value) {
            if (!validator.default.isEmail(value)) {
                throw new Error("Invalid email");
            }
        },
    },
    phoneNo: {
        type: Number,
        required: true,
        unique: true,
        validator(value) {
            if (!validator.default.isMobilePhone(value, "en-IN")) {
                throw new Error("Invalid phoneNumber");
            }
        },
    },
    password: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female'],
        required: true,
    },
    role: {
        type: String,
        enum: ['Admin', 'SuperAdmin', 'User'],
        default: 'User',
    },
    profileImage: {
        type: String,
        required: true
    },
    documentFront: {
        type: String,
    },
    documentBack: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isDocVerified: {
        type: Boolean,
        default: false

    }


}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
