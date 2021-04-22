/*  ======
    Import
    ======
*/
// global config file
require('dotenv').config();
// npm packages
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwtModule = require('./../important/jwt');
const jwt = require('jsonwebtoken');

// get schema to get user
const login_schema = require('./../schemas/register_access');
const entriesSchema = require('./../schemas/register_entries');

// define Router
let router = express.Router();
// create noSQL connection
mongoose.connect(process.env.MONGODB_SERVER, { useNewUrlParser: true, useUnifiedTopology: true });
/*  ====
    Code
    ====
*/
// define main router
router.post('/', (req, res) => {
    try {
        refreshToken = '';
        // find user in db
        login_schema.find({ username: req.body.username }, function(err, doc) {
            // check for error
            if (err) {
                // send error
                res.send({ status: 'somethingWiredOccured' });
                // end function
                return;
            }
            // check if user exists
            if (doc[0] === undefined) {
                // send error
                res.send({ status: 'noUserFound' });
                // end function
                return;
            }
            bcrypt.compare(req.body.password, doc[0].password, function(err, hash) {
                // check for error
                if (err) {
                    // send error
                    res.send({ status: 'somethingWiredOccured' });
                    // end function
                    return;
                }
                // check if password is invalid
                if (!hash) {
                    // send error
                    res.send({ status: 'wrongPassword' });
                    // end function
                    return;
                }
                // check if account is not activated
                if (doc[0].status !== 'activated') {
                    // send error
                    res.send({ status: 'notActivated' });
                    // end function
                    return;
                }
                // get user from entries collection
                entriesSchema.find({ username: req.body.username }, (err, doc2) => {
                    user = {
                        id: doc[0]._id,
                        entriesID: doc2[0]._id,
                        username: doc[0].username,
                        adminLevel: doc[0].adminLevel,
                        lastLogin: doc[0].lastLogin,
                        redirect: doc[0].redirect,
                        createdAt: Date.now()
                    };
                    // create accesstoken
                    // call func in other module
                    accessToken = jwtModule.generateAccessToken(user);
                    // check if there is no refreshToken in db
                    if (doc[0].refreshToken === null) {
                        // if not generate one
                        refreshToken = jwtModule.generateRefreshToken(user);
                        // if there is one in the db
                    } else {
                        // get it
                        refreshToken = doc[0].refreshToken;
                    }
                    // find user in the db
                    login_schema.findById(doc[0]._id, function(err, doc) {
                        // get the current date
                        ts = Date.now();
                        date_full = new Date(ts);
                        date = date_full.getDate();
                        month = date_full.getMonth() + 1;
                        year = date_full.getFullYear();
                        // insert it into the db (lastLogin)
                        doc.lastLogin = date + '.' + month + '.' + year;
                        doc.save();
                    });
                    // send successfull code
                    // send status and both tokens to frontend
                    res.status(200).send({
                        status: 'accessGranted',
                        adminLevel: doc[0].adminLevel,
                        accessToken: accessToken,
                        refreshToken: refreshToken
                    });
                });
            });
        });
    } catch {
        res.send({ status: 'error' });
    }
});
// route for autologin
// used for rememberMe function
router.post('/autoLogin', (req, res) => {
    try {
        // check if accessToken from user is valid
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // check if the token is expired
            if (err.name === 'TokenExpiredError') {
                // then send error
                res.send({ status: 'tokenExpired' });
                // end function
                return;
            }
            // if error occured
            if (err) {
                // send error
                res.send({ status: 'tokenInvalid' });
                // end function
                return;
            }
            // get user from db
            login_schema.find({ username: user.username }, function(err, doc) {
                // if error
                if (err) {
                    // send error
                    res.send({ status: 'somethingWentWrong' });
                    // end function
                    return;
                }
                // send good code to user
                // and a new accessToken
                // using data from the db
                res.status(200).send({
                    status: 'autoLoginSuccess',
                    newToken: jwtModule.generateAccessToken({
                        id: doc[0]._id,
                        username: user.username,
                        adminLevel: doc[0].adminLevel,
                        lastLogin: doc[0].lastLogin
                    })
                });
            });
        });
    } catch {
        res.send({ status: 'error' });
    }
});
// erport router
module.exports = router;