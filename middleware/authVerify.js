const User = require('../models/user');
const JWT = require("jsonwebtoken");
const secret = "Secret$123";

const verifyUser = async (req, res, next) => {
    let authToken = req.header('Authorization');
    // console.log(authToken)
    if (!authToken || !authToken.startsWith("Bearer ")) {
        return res.status(401).send({ success: false, msg: "Token is required" });
    }
    // try{

    let token = authToken.split("Bearer ")[1];
    // verify token

    const decodeToken = await JWT.verify(token, secret);
    if (!decodeToken) {
        return res.status(404).send({ success: false, msg: "Unauthorized token" }); f
    }

    req.user = decodeToken;
    next();

    // }catch(err){
    //     return res.status(404).send({success:false, msg: err});
    // }    

}

module.exports = verifyUser