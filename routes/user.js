const { Router } = require("express");

const { body } = require('express-validator');

const multer = require("multer");

const {
    registerUser,
    uploadDocuments,
    userLogin,
    onLogin,
    verifyDocuments,
    verifyEmail
} = require("../controllers/user");

const verifyUser = require("../middleware/authVerify")


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        const filename = `${Date.now()}-${file.originalname}`
        cb(null, filename);
    }
})

const upload = multer({ storage: storage })

const router = Router();

router.post('/signup', upload.single("profileImage"), [
    body('email', "Invalid Email").trim().isEmail(),
    body('password', "Password should be minimum 8 character length").trim().isLength({ min: 8 }),
    body('phoneNo', "Provide a valid phone number").trim().isLength({ min: 10 })
], registerUser);

router.post('/uploadDocuments', upload.fields([{ name: 'frontImg', maxCount: 1 }, { name: 'backImg', maxCount: 1 }]), verifyUser, uploadDocuments);

router.post('/login', [
    body('email', "Provide a valid email").isEmail(),
    body('password').trim().isLength({ min: 8 }),
], userLogin);

router.get('/', verifyUser, onLogin);
router.post('/', verifyUser, verifyDocuments);
router.get('/verify-email/:id', verifyEmail)

module.exports = router;