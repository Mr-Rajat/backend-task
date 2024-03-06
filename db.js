require('dotenv').config();
const mongoose = require('mongoose');
const uri = process.env.MONGODBURI;
exports.connect = async () => {
    mongoose.connect(uri, { family: 4 })
        .then(() => console.log('MongoDB is connected'))
        .catch((err) => {
            console.log(err);
        })
}