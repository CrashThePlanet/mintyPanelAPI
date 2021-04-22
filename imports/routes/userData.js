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

// mongoose schemas
const entriesSchema = require('./../schemas/register_entries');
const accessSchema = require('./../schemas/register_access');
const requestSchema = require('./../schemas/requestSchema');
// define Router
let router = express.Router();
// create noSQL connection
mongoose.connect(process.env.MONGODB_SERVER, { useNewUrlParser: true, useUnifiedTopology: true });
/*  ====
    Code
    ====
*/
// define route to get the own data
router.post('/', (req, res) => {
    try {
        // chekc if the access token is valid
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // check for invalid token
            if (err) {
                // send error to user
                res.send({ status: 'tokenError' });
                // end function
                return;
            }
            // find the user in the entrie db using the id from the token
            entriesSchema.findById(user.entriesID, (err, doc) => {
                // if the could not be found (or any other error)
                if (err) {
                    // send error
                    res.send({ status: 'noUser' });
                    // end function
                    return;
                }
                // put all the needed data an array
                respondData = {
                    forname: doc.forname,
                    surname: doc.surname,
                    nickname: doc.nickname,
                    birthDate: doc.birthDate,
                    postCode: doc.postCode,
                    place: doc.place,
                    houseNumber: doc.houseNumber,
                    phone: doc.phone,
                    email: doc.secondEmail,
                    redirect: user.redirect,
                    notes: doc.notes
                };
                // send a status an this array back to the user
                res.send({ status: 'gotData', content: respondData });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// route to send a rquest to change the data
router.post('/update', (req, res) => {
    try {
        // check if the access token is valid
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // check for invalid token
            if (err) {
                // send error to user
                res.send({ status: 'tokenError' });
                // end function
                return;
            }
            // check if there is already a request in the db
            entriesSchema.find({ username: user.username }, (err, doc) => {
                // check if
                if (doc.length === 0) {
                    // if, send error to user
                    res.send({ status: 'requestInQueue' });
                    // end function
                    return;
                }
                // get the user from entries collection
                entriesSchema.findById(user.entriesID, (err, doc) => {
                    // check if there is an error
                    if (err) {
                        // send error to user
                        res.send({ status: 'noUser' });
                        // end function
                        return;
                    }
                    // get the current date (dd.mm.yyyy)
                    ts = Date.now();
                    date_full = new Date(ts);
                    date = date_full.getDate();
                    month = date_full.getMonth() + 1;
                    year = date_full.getFullYear();
                    currentDate = date + '.' + month + '.' + year;
                    // check if the date of the last request from the user
                    // is the same as the current date
                    // => check if the user already send a request today
                    if (doc.lastRequest === currentDate) {
                        // send error
                        res.send({ status: 'alreadyRequested' });
                        // end function
                        return;
                    }
                    // get new Data
                    newData = req.body.newData;
                    // add the username to the data
                    newData.username = user.username;
                    // insert data into collection for the requests
                    insert = new requestSchema(newData);
                    insert.save();
                    // change the last request of the user to today
                    doc.lastRequest = currentDate;
                    doc.save();
                    // send feedback
                    res.send({ status: 'requestSend' });
                });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to get all users
router.post('/getall', (req, res) => {
    try {
        // check if the access token is valid
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // check for error
            if (err) {
                // send error
                res.send({ status: 'tokenError' });
                // end function
                return;
            }
            // check if the admin level of the user is not high enough
            if (user.adminLevel !== 3) {
                // send error
                res.send({ status: 'accessDenied' });
                // end function
                return;
            }
            // get all users
            entriesSchema.find({}, (err, users) => {
                // check if there is an error
                if (err) {
                    // send error
                    res.send({ status: 'couldntFindUsers' });
                    // end function
                    return;
                }
                // define empty array for the users
                usersArray = [];
                // loop through all users
                users.forEach((user) => {
                    // put the data from the user (as array) in the array above
                    usersArray.push({
                        username: user.username,
                        forname: user.forname,
                        surname: user.surname,
                        nickname: user.nickname,
                        birthdate: user.birthdate,
                        email: user.secondEmail,
                        secondEmail: user.secondEmail,
                        job: user.job,
                        phone: user.phone,
                        postCode: user.postCode,
                        place: user.place,
                        houseNumber: user.houseNumber,
                        createdAt: user.createdAt,
                        notes: user.notes
                    });
                });
                // send feedback and all users
                res.send({ status: 'gotUsers', users: usersArray });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to get all requests
router.post('/getrequests', (req, res) => {
    try {
        // check if the token is valid
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // check for error
            if (err) {
                // send error
                res.send({ status: 'tokenError' });
                // end function
                return;
            }
            // check if the admin level of the user is not high enough
            if (user.adminLevel !== 3) {
                // send error
                res.send({ status: 'accessDenied' });
                // end function
                return;
            }
            // get all requests
            requestSchema.find({}, async(err2, requests) => {
                // check for an error
                if (err2) {
                    // send error
                    res.send({ status: 'couldntFindRequests' });
                    // end function
                    return;
                }
                // define empty array for the requests
                requestsArray = [];
                // lopp through all requets
                for (const request of requests) {
                    // check if the status is 'nothing' (default)
                    if (request.status !== 'nothing') {
                        // skip loop iteration
                        continue;
                    }
                    // get user from borth user collections
                    userEntries = await entriesSchema.find({ username: request.username });
                    userAccess = await accessSchema.find({ username: request.username });
                    // put the new and the old data in the array
                    requestsArray.push({
                        // the old data
                        old: {
                            username: userEntries[0].username,
                            forname: userEntries[0].forname,
                            surname: userEntries[0].surname,
                            nickname: userEntries[0].nickname,
                            birthdate: userEntries[0].birthDate,
                            email: userEntries[0].secondEmail,
                            secondEmail: userEntries[0].secondEmail,
                            redirect: userAccess[0].redirect,
                            job: userEntries[0].job,
                            phone: userEntries[0].phone,
                            postCode: userEntries[0].postCode,
                            place: userEntries[0].place,
                            houseNumber: userEntries[0].houseNumber,
                            notes: userEntries[0].notes,
                            idE: userEntries[0]._id,
                            idA: userAccess[0]._id
                        },
                        // the new data
                        new: {
                            forname: request.forname,
                            surname: request.surname,
                            birthdate: request.birthDate,
                            nickname: request.nickname,
                            secondEmail: request.secondEmail,
                            redirect: request.redirect,
                            phone: request.phone,
                            postCode: request.postCode,
                            place: request.place,
                            houseNumber: request.houseNumber,
                            notes: request.notes,
                            dateOfRequest: request.dateOfRequest,
                            idR: request._id
                        }
                    });
                }
                // check if there are no requests
                if (requestsArray.length < 1) {
                    // send feedback
                    res.send({ status: 'noRequests' });
                    // end function
                    return;
                }
                // send feedback and request to user
                res.send({ status: 'gotRequests', requests: requestsArray });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to decline a request
router.post('/delinerequest', (req, res) => {
    try {
        // check if the access token is valid
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // check for error
            if (err) {
                // send error
                res.send({ status: 'tokenError' });
                // end function
                return;
            }
            // check if the admin level of the user is not high enough
            if (user.adminLevel !== 3) {
                // send error
                res.send({ status: 'accessDenied' });
                // end function
                return;
            }
            // find the request ba the id
            requestSchema.findById(req.body.data.requestID, (err, request) => {
                // check for error
                if (err) {
                    // send error
                    res.send({ status: 'requestNotFound' });
                    // end function
                    return;
                }
                // change status of the request
                request.status = 'declined';
                // insert the reasen why the request got declined
                request.message = req.body.data.message;
                // save the new data
                request.save();
                // send feedback
                res.send({ status: 'requestDeclined' });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to accapt a request
router.post('/accaptrquest', (req, res) => {
    try {
        // check if the access token is valid
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // check for error
            if (err) {
                // send errormassege
                res.send({ status: 'tokenError' });
                // end function
                return;
            }
            // check if the admin level of the user is not high enough
            if (user.adminLevel !== 3) {
                // send error
                res.send({ status: 'accessDenied' });
                // end function
                return;
            }
            // find the request by the id
            requestSchema.findById(req.body.data.idR, async(err, request) => {
                // check for error
                if (err) {
                    // send error
                    res.send({ status: 'requestNotFound' });
                    // end function
                    return;
                }
                // find the user in access collection
                await accessSchema.findById(req.body.data.idA, (err, userA) => {
                    // check for error
                    if (err) {
                        // send error
                        res.send({ status: 'userNotFound' });
                        // end function
                        return;
                    }
                    // uptdate the redirect (for the email)
                    // with the value from the reuqest
                    userA.redirect = request.redirect;
                    // save updates
                    userA.save();
                });
                // find user in entries collection
                await entriesSchema.findById(req.body.data.idE, (err, userE) => {
                    // check for error
                    if (err) {
                        // send error
                        res.send({ status: 'userNotFound' });
                        // end function
                        return;
                    }
                    // put the new data from the request in the entrie
                    userE.forname = request.forname;
                    userE.surname = request.surname;
                    userE.birthDate = request.birthDate;
                    userE.nickname = request.nickname;
                    userE.postCode = request.postCode;
                    userE.place = request.place;
                    userE.houseNumber = request.houseNumber;
                    userE.phone = request.phone;
                    userE.secondEmail = request.secondEmail;
                    userE.notes = request.notes;
                    // save the new data
                    userE.save();
                });
                // update the data of the request
                request.status = 'accapted';
                // save changes
                request.save();
                // send feedback
                res.send({ status: 'accaptSuccess' });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to get all users depending on their status
router.post('/getstatus', (req, res) => {
    try {
        // check if the access token is valid
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, userT) => {
            // check for error
            if (err) {
                // send error
                res.send({ status: 'tokenError' });
                // end function
                return;
            }
            // check if the admin level of the user is not high enough
            if (userT.adminLevel !== 3) {
                // send error
                res.send({ status: 'accessDenied' });
                // end function
                return;
            }
            // fin all users in access collection
            accessSchema.find({}, (err, users) => {
                // check for error
                if (err) {
                    // send error
                    res.send({ status: 'usersNotFound' });
                    // end function
                    return;
                }
                // define empty array for the three status types
                notActivated = [];
                activated = [];
                deactivated = [];
                // loop through all users
                users.forEach((user) => {
                    // check for the three status types and put the data
                    // in the right array for that status
                    if (user.status === 'notActivated') {
                        notActivated.push({
                            username: user.username,
                            status: user.status,
                            adminLevel: user.adminLevel,
                            id: user._id
                        });
                    }
                    if (user.status === 'activated') {
                        activated.push({
                            username: user.username,
                            status: user.status,
                            adminLevel: user.adminLevel,
                            id: user._id
                        });
                    }
                    if (user.status === 'deactivated') {
                        deactivated.push({
                            username: user.username,
                            status: user.status,
                            adminLevel: user.adminLevel,
                            id: user._id
                        });
                    }
                });
                // send feedback and the 3 arrays
                res.send({
                    status: 'gotUsers',
                    user: {
                        notActivated: notActivated,
                        activated: activated,
                        deactivated: deactivated
                    }
                });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route activate a user
router.post('/activate', (req, res) => {
    try {
        // check if the access token is valid
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // check for error
            if (err) {
                // send error
                res.send({ status: 'tokenError' });
                // end function
                return;
            }
            // check if the admin level of the user is not high enough
            if (user.adminLevel !== 3) {
                // send error
                res.send({ status: 'accessDenied' });
                // end function
                return;
            }
            // find the user in the access collection using the id
            accessSchema.findById(req.body.id, (err, aUser) => {
                // check for error
                if (err) {
                    // send error
                    res.send({ status: 'userNotFound' });
                    // end function
                    return;
                }
                // change status
                aUser.status = 'activated';
                // save new status
                aUser.save();
                // send feedback
                res.send({ status: 'activateSuccessful' });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
//Define routes to deactivate a user
router.post('/deactivate', (req, res) => {
    try {
        // check if the access token is valid
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // check for error
            if (err) {
                // send error
                res.send({ status: 'tokenError' });
                // end function
                return;
            }
            // check if the admin level of the user is not high enough
            if (user.adminLevel !== 3) {
                // send error
                res.send({ status: 'accessDenied' });
                // end function
                return;
            }
            // find the user in the access collection using the id
            accessSchema.findById(req.body.id, (err, aUser) => {
                // check for error
                if (err) {
                    // send error
                    res.send({ status: 'userNotFound' });
                    // end function
                    return;
                }
                // change status of the user
                aUser.status = 'deactivated';
                // save
                aUser.save();
                // send feedback
                res.send({ status: 'deactivateSuccessful' });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route upgrade a user to an admin
router.post('/toadmin', (req, res) => {
    try {
        // check if the access token is valid
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // check for error
            if (err) {
                // send error
                res.send({ status: 'tokenError' });
                // end function
                return;
            }
            // check if the admin level of the user is not high enough
            if (user.adminLevel !== 3) {
                // send error
                res.send({ status: 'accessDenied' });
                // end function
                return;
            }
            // find the user in the access collection using the id
            accessSchema.findById(req.body.id, (err, aUser) => {
                // check for error
                if (err) {
                    // send error
                    res.send({ status: 'userNotFound' });
                    // end function
                    return;
                }
                // change admin level of the user
                aUser.adminLevel = 3;
                // save
                aUser.save();
                // send feedback
                res.send({ status: 'upgradeSuccessful' });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to get (possible) reactions to requests of the user
router.post('/getrequestreactions', (req, res) => {
    try {
        // check if the access token is valid
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // check for error
            if (err) {
                // send error
                res.send({ status: 'tokenError' });
                // end function
                return;
            }
            // find the first request of the user
            requestSchema.find({ username: user.username }, (err, userR) => {
                // check for error or if there are no reqests
                if (err || userR[0] === undefined) {
                    // send error / feedback
                    res.send({ status: 'noRequestFound' });
                    // end function
                    return;
                }
                // check if there was no reaction / no change
                if (userR[0].status === 'nothing') {
                    // send feedback
                    res.send({ status: 'notReacted' });
                    // end function
                    return;
                }
                // check if the request got declined
                if (userR[0].status === 'declined') {
                    // send feedback, message / reason for decline and the id of the request
                    res.send({ status: 'declined', message: userR[0].message, id: userR[0].id });
                    // end function
                    return;
                }
                // check if the function got accapted
                if (userR[0].status === 'accapted') {
                    // send feedback and the id of the request
                    res.send({ status: 'accapted', id: userR[0].id });
                    // end function
                    return;
                }
                // send error and the id
                res.send({ status: 'corruptedRequest', id: userR[0].id });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to delete a request
router.post('/deleterequest', (req, res) => {
    try {
        // check if the access token is valid
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // check for error
            if (err) {
                // send error
                res.send({ status: 'tokenError' });
                // end function
                return;
            }
            // try to delete the request
            try {
                // delete request
                requestSchema.findByIdAndDelete(req.body.id).exec();
                // send feedback
                res.send({ status: 'requestDelete' });
            } catch (error) {
                // if there is an error
                // send error
                res.send({ status: 'notDeleted' });
            }
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// erport router
module.exports = router;