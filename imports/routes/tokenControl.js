/*  ======
    Import
    ======
*/
// global config file
require('dotenv').config();
// npm packages
const express = require('express');
const mongoose = require('mongoose');
const jwtModule = require('./../important/jwt');
const jwt = require('jsonwebtoken');

// get schema to get user
const login_schema = require('./../schemas/register_access');

// define Router
let router = express.Router();
// create noSQL connection
mongoose.connect(process.env.MONGODB_SERVER, { useNewUrlParser: true, useUnifiedTopology: true });
/*  ====
    Code
    ====
*/
// define route to validate access token
router.post('/validateToken', (req, res) => {
    try {
        // varify the token
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, AToken) => {
            // check if token is expired
            if (err !== null && err.name === 'TokenExpiredError') {
                // send error
                res.send({ status: 'tokenExpired' });
                // end function
                return;
            }
            // check if there is any other error
            if (err) {
                // send error
                res.send({ status: 'invalidToken' });
                // end function
                return;
            }
            // send message
            res.send({ status: 'tokenValid' });
            return;
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to refreh access token
router.post('/refreshToken', (req, res) => {
    try {
        // check if refresh token is valid
        jwt.verify(req.body.refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, RToken) => {
            // check if the token is invalid
            if (err) {
                // send error
                res.send({ status: 'invalidRefreshToken' });
                // end function
                return;
            }
            // find user
            login_schema.findById(RToken.id, (err, user) => {
                // if user couldn´t be found
                if (err) {
                    // send server error
                    res.send({ status: 'serverError' });
                    // end function
                    return;
                }
                // check if the refresh token from the user and
                // the refresh token from the db are the unequel
                if (user.refreshToken !== req.body.refreshToken) {
                    // send error
                    res.send({ status: 'unequelRefreshToken' });
                    // end function
                    return;
                }
                // if, check if expired access token is valid (ignore the expiration)
                jwt.verify(req.body.expiredToken, process.env.ACCESS_TOKEN_SECRET, { ignoreExpiration: true }, (err, AToken) => {
                    // check if the token is invalid
                    if (err) {
                        // send error
                        res.send({ status: 'invalidToken' });
                        // end function
                        return;
                    }
                    // generate new access token
                    newTokenData = {
                        id: AToken.id,
                        entriesID: AToken.entriesID,
                        username: AToken.username,
                        adminLevel: AToken.adminLevel,
                        lastLogin: AToken.lastLogin,
                        redirect: AToken.redirect,
                        createdAt: Date.now()
                    };
                    newToken = jwtModule.generateAccessToken(newTokenData);
                    // send positiv feedback and new token back to user
                    res.send({ status: 'newTokenCreated', newAccessToken: newToken, adminLevel: AToken.adminLevel, refreshToken: req.body.refreshToken });
                });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// erport router
module.exports = router;