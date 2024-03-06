const User = require('../models/user');
const { isValidObjectId } = require("mongoose")

const bcrypt = require('bcrypt');
const fs = require('fs')
const JWT = require("jsonwebtoken");
const secret = "Secret$123";

const { validationResult } = require('express-validator');

const nodemailer = require("nodemailer");

function sendEmail(emailAddress, userId) {
    return new Promise((resolve, reject) => {
        try {
            // Create a transporter object
            const transporter = nodemailer.createTransport({
                service: "gmail",
                host: "smtp.gmail.com",
                port: 465, // 465 for secure true, 587 for normal
                secure: true,
                auth: {
                    user: "rajatch131@gmail.com",
                    pass: "hdvielkojosyzlui",
                },
            });
            // Create a mail object
            const mailOptions = {
                from: "rajatch133@gmail.com",
                to: emailAddress,
                subject: "Verify email address",
                html: `
              <h1>Click to verify email</h1>
              <p>Thanks for registering for an account with us, we just need to confirm that this is you.Click below to verify your email address: </p><br>
              <a href="http://localhost:8000/user/verify-email/${userId}" target="_blank">Verify Email</a>
            `,
            };
            // Send the mail
            transporter.sendMail(mailOptions, function (err, info) {
                if (err) {
                    reject(err.message);
                } else {
                    resolve(info);
                }
            });
        } catch (err) {
            reject(err);
        }
    });
}

const validatePassword = (password) => {
    // Define regular expressions for validation
    const numericRegex = /\d/; // At least one numeric character
    const specialCharRegex = /[!@#$%^&*_]/; // At least one special character
    const minLength = 8; // Minimum password length

    // Check if the password meets the criteria
    const hasNumeric = numericRegex.test(password);
    const hasSpecialChar = specialCharRegex.test(password);
    const isLengthValid = password.length >= minLength;

    // Return true if all criteria are met, otherwise return false
    return hasNumeric && hasSpecialChar && isLengthValid;
};

const registerUser = async (req, res) => {
    const { name, email, phoneNo, password, cpassword, gender } = req.body;
    const profile = req.file.path;
    console.log(profile)

    if (!name || !email || !phoneNo || !password || !gender || !profile) {
        throw new Error("Please provide all fields...");
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        let existingUser = await User.findOne({
            $and: [
                { email },
                { phoneNo }
            ]
        })
        // If user with given email already
        if (existingUser) {
            return res.status(400).send({ success: false, msg: "User with email or phone already exists.." })
        }

        if (password !== cpassword) {
            return res.status(400).send({ success: false, msg: "Password and confirm password do no match" })
        }

        const isPasswordValid = validatePassword(password);

        if (!isPasswordValid) {
            return res.status(400).json({
                succes: false,
                message:
                    "Invalid password format. Password must contain at least one special character, one numeric character and be at least 8 characters long.",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            phoneNo,
            password: hashedPassword,
            gender,
            profileImage: profile
        });

        if (!newUser) {
            return res.status(500).send({ success: false, msg: "Something went wrong.." });
        }

        let sentEmail = sendEmail(newUser.email, newUser._id);

        sentEmail.then(() => console.log("email sent successfully")
        ).catch((err) => { console.log("Error: ", err) })

        return res.status(201).send({ success: true, data: newUser, msg: "User Created Successfully...Click on verify email link" });

    } catch (err) {
        console.log(err)
        res.end("Something went wrong")
    }
}

const uploadDocuments = async (req, res) => {

    const documentFront = req.files.frontImg[0].path;
    const documentBack = req.files.backImg[0].path;

    // console.log("User: ",req.user)

    if (!documentBack || !documentFront) {
        if (documentBack) {
            fs.unlink(documentBack)
        }
        if (documentFront) {
            fs.unlink(documentFront)
        }
        return res.status(404).send({ success: false, msg: "Front and Back image is required" })

    }
    try {

        const user = await User.findById(req.user?.id);
        if (!user) {
            return res.status(404).send({ success: false, msg: "User not found" })
        }

        user.documentFront = documentFront;
        user.documentBack = documentBack;

        const updatedUser = await user.save();

        return res.status(200).send({ success: true, msg: "Documents added successfully" })

    } catch (err) {
        return res.status(500).send({ success: false, err: err });
    }

}

const userLogin = async (req, res) => {
    const { email, password } = req.body;
    // console.log(req.body);

    if (!email || !password) {
        return res.status(404).send({ succes: false, msg: "UserName and password are required" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send({ succes: false, msg: "User not found with this email" });
        }
        const hashedPassword = user.password;
        const validatePassword = await bcrypt.compare(password, hashedPassword);

        if (!validatePassword) {
            return res.status(401).send({ success: false, msg: "Password do not match" });
        }

        if (!user.isVerified) {
            // todo send email with link
            let sentEmail = sendEmail(user.email, user._id);

            sentEmail.then(() => console.log("email sent successfully")

            ).catch((err) => { console.log("Error: ", err) })

            return res.status(401).send({ succes: false, msg: "Please verify email by clicking on the link provided in the email." })
        }

        let token = JWT.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
            }, secret,
            { expiresIn: '4h' }
        );

        return res.status(200).send({ succes: true, msg: "Loggin Successfull", token: token });


    } catch (err) {
        return res.status(400).send({ success: false, err: err });
    }
}


const onLogin = async (req, res) => {
    if (req.user.role === 'Admin' || "SuperAdmin") {

        const userList = await User.find({}).select("-password");

        return res.status(200).send({ succes: true, msg: "User list fetched successfully", data: userList });

    }
    if (req.user.role === "User") {
        const userData = await User.findById(req.user?.id).select('-password');
        return res.status(200).send({ succes: true, msg: "User data fetched successfully", data: userData });
    }

    else {
        return res.status(400).send({ succes: false, msg: "No user record found" }); f
    }
}

const verifyDocuments = async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).send({ succes: false, msg: "user id is required" });
    }

    if (req.user?.id !== "SuperAdmin") {
        return res.status(401).send({ succes: false, msg: "Unauthorized to verify documents" });
    }

    const userStatus = await User.findById(userId);

    if (!userStatus) {
        return res.status(404).send({ succes: false, msg: "No user found with the given id" });
    }

    userStatus.isDocVerified = true;

    await userStatus.save();

    return res.status(200).send({ succes: true, msg: "User Document verified successfully" });

}

const verifyEmail = async (req, res) => {
    const userId = req.params.id;

    if (!userId || !isValidObjectId(userId)) {
        return res.status(400).send({ succes: false, msg: "userId not provided" });
    }

    try {
        const validUser = await User.findById(userId);

        if (!validUser) {
            return res.status(404).json({ succes: false, msg: "User with Id not found" })
        }

        if (validUser.isVerified) {
            return res.status(200).json({ success: true, msg: "Email is already verified..." })
        }
        validUser.isVerified = true;

        await validUser.save();

        return res.status(200).json({ succes: true, msg: "Email verified successfully" })

    } catch (err) {
        return res.status(400).json({ success: false, err: err });
    }


}

module.exports = {
    registerUser,
    uploadDocuments,
    userLogin,
    onLogin,
    verifyDocuments,
    verifyEmail
}