/*  ======
    Import
    ======
*/
// global config file
require('dotenv').config();
// npm packages
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
// get schema to get user
const login_schema = require('./../schemas/register_access');
// create noSQL connection
mongoose.connect(process.env.MONGODB_SERVER, { useNewUrlParser: true, useUnifiedTopology: true });
// export router
module.exports = {
    // function to create accessToken
    // needs userdata
    generateAccessToken(user) {
        // create and return token
        // using secret key from .env
        // expires after 15m
        return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' });
    },
    // function to generate refreshToken
    generateRefreshToken(user) {
        // generate token
        const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
        // get the user
        login_schema.findById(user.id, function (err, doc) {
            // check if error
            if (err) {
                // if, return undefined
                return undefined;
            }
            // if not, insert token ind db
            doc.refreshToken = refreshToken;
            doc.save();
            // and return token 
            return refreshToken;
        });
    }
};