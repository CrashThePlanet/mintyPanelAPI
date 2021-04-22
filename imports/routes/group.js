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

// get schemas to get user
const accessSchema = require('./../schemas/register_access');
const entriesSchema = require('./../schemas/register_entries');
// schema for the task
const taskSchema = require('./../schemas/task');
//schema for the group
const groupSchema = require('./../schemas/group');

// define Router
let router = express.Router();
// create noSQL connection
mongoose.connect(process.env.MONGODB_SERVER, { useNewUrlParser: true, useUnifiedTopology: true });
/*  ====
    Code
    ====
*/
// define Route to get all groups
router.post('/get', (req, res) => {
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
            // get all groups using the group schema
            groupSchema.find({}, (err, groups) => {
                // check for error
                if (err) {
                    // send error
                    res.send({ status: 'noGroupsFound' });
                    // end function
                    return;
                }
                // define empty array for the groups
                groupsArray = [];
                // loop through all groups
                groups.forEach((group) => {
                    // put the data of the group in the array
                    groupsArray.push({
                        id: group._id,
                        name: group.name,
                        workspace: group.workspace,
                        description: group.description
                    });
                });
                // send feedback and the groups
                res.send({ status: 'gotGroups', groups: groupsArray });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to get the groups of ONE user
router.post('/gerpersonal', (req, res) => {
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
            // find the user using the id
            accessSchema.findById(user.id, async(err, userA) => {
                // check for error
                if (err) {
                    // send error
                    res.send({ status: 'userNotFound' });
                    // end function
                    return;
                }
                // define empty array for the groups (just the name)
                groupsArray = [];
                // loop through all group of the user
                for (const group of userA.groups) {
                    // find the group using this is
                    await groupSchema.findById(group, (err, groupS) => {
                        // check for error
                        if (err) {
                            // send error
                            res.send({ status: 'groupNotFound' });
                            // end function
                            return;
                        }
                        // put the name of the group in the array
                        groupsArray.push(groupS.name);
                    });
                }
                // send feedback and the name of the groups
                res.send({ status: 'gotGroups', groups: groupsArray });
            });
        });
    } catch {
        //send an error
        res.send({ status: 'error' });
    }
});
// define route to get all possible users / member / editor
router.post('/getuser', (req, res) => {
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
            // get all users using the accessSchema
            accessSchema.find({}, (err, users) => {
                // check for error
                if (err) {
                    // send error
                    res.send({ status: 'usersNotFound' });
                    // end function
                    return;
                }
                // define empty array for the users
                usersArray = [];
                // loop through all users
                users.forEach((user) => {
                    // check if the user is activated so he can do things
                    if (user.status === 'activated') {
                        // put the username in the array
                        usersArray.push(user.username);
                    }
                });
                // send feedback and the users
                res.send({ status: 'gotUsers', users: usersArray });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to create a new group
router.post('/create', (req, res) => {
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
            // try to create the group
            try {
                // create the group using the data from the user
                const group = new groupSchema({
                    name: req.body.group.name,
                    description: req.body.group.description,
                    workspace: req.body.group.workspace,
                    member: req.body.group.member
                });
                // save the new group
                group.save();
                // loop through every member of the group
                req.body.group.member.forEach((userM) => {
                    // find the user in the access collection
                    accessSchema.find({ username: userM }, (err, user) => {
                        // check for error
                        if (err) {
                            // send error
                            res.send({ status: 'userNotAssigned' });
                            // end function
                            return;
                        }
                        // get all groups of this user
                        groups = user[0].groups;
                        // add the id of the new group
                        groups.push(group.id);
                        // check if the first position is "null"
                        if (groups[0] === "null") {
                            // delete this "null"
                            groups.splice(0, 1);
                        }
                        // insert the array with the new groups in the user
                        user[0].groups = groups;
                        // save
                        user[0].save();
                    });
                });
                // send feedback
                res.send({ status: 'groupCreated' });
            } catch {
                // if an error ocurred
                // send error
                res.send({ status: 'failedToCreateGroup' });
            }
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define router to delete a group
router.post('/delete', (req, res) => {
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
            // try to delete the group
            try {
                // find the group
                groupSchema.findById(req.body.id, (err, group) => {
                    // check for error
                    if (err) {
                        // send error
                        res.send({ status: 'groupNotFound' });
                        // end function
                        return;
                    }
                    // loop through all member
                    group.member.forEach((userG) => {
                        // find the member
                        accessSchema.find({ username: userG }, (err, user) => {
                            // check for error
                            if (err) {
                                // send error
                                res.send({ status: 'memberNotFound' });
                                // end function
                                return;
                            }
                            // get the position of the targeted groups in the
                            // array of groups of the user
                            index = user[0].groups.indexOf(group.id);
                            // get the groups of the user
                            groups = user[0].groups;
                            // remove the group
                            groups.splice(index, 1);
                            // insert the groups into the user
                            user[0].groups = groups;
                            // save
                            user[0].save();
                        });
                    });
                });
                // find the group using the id from the call, delete it and execute the delete
                groupSchema.findByIdAndRemove(req.body.id).exec();
                // send feedback
                res.send({ status: 'groupDeleted' });
            } catch (error) {
                // id an error ocurred
                // send error
                res.send({ status: 'groupNotDeleted' });
            }
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to get the data of one group
router.post('/getone', (req, res) => {
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
            // find the group using the id from the call
            groupSchema.findById(req.body.id, (err, group) => {
                // check for error
                if (err) {
                    // send error
                    res.send({ status: 'groupNotFound' });
                    // end function
                    return;
                }
                // send feedback and the data of this group
                res.send({
                    status: 'gotGroup',
                    group: {
                        name: group.name,
                        description: group.description,
                        workspace: group.workspace,
                        member: group.member
                    }
                });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to update a group
router.post('/update', (req, res) => {
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
            // find the group using the id from the call
            groupSchema.findById(req.body.data.id, (err, group) => {
                // chekc for error
                if (err) {
                    // send error
                    res.send({ status: 'groupNotFound' });
                    // end function
                    return;
                }
                // remove the id of the group from the users wich got removed
                // from the group
                // loop through the old members
                group.member.forEach((userM) => {
                    // check if the old member is NOT in the new one
                    if (!req.body.data.member.includes(userM)) {
                        // find the member
                        accessSchema.find({ username: userM }, (err, user) => {
                            // check for error
                            if (err) {
                                // send error
                                res.send({ status: 'memberNotFound' });
                                // end function
                                return;
                            }
                            // get the position of the targeted groups in the
                            // array of groups of the user
                            index = user[0].groups.indexOf(group.id);
                            // get the groups of the user
                            groups = user[0].groups;
                            // remove the group
                            groups.splice(index, 1);
                            // insert the groups into the user
                            user[0].groups = groups;
                            // save
                            user[0].save();
                        });
                    }
                });
                // add the of the group to the users wich are newly added
                // to the group
                // lopp through all new member
                req.body.data.member.forEach((userM) => {
                    // check if the new member is not in the array of the old ones
                    if (!group.member.includes(userM)) {
                        // find the user in the access collection
                        accessSchema.find({ username: userM }, (err, user) => {
                            // check for error
                            if (err) {
                                // send error
                                res.send({ status: 'userNotAssigned' });
                                // end function
                                return;
                            }
                            // get all groups of this user
                            groups = user[0].groups;
                            // add the id of the new group
                            groups.push(group.id);
                            // check if the first position is "null"
                            if (groups[0] === "null") {
                                // delete this "null"
                                groups.splice(0, 1);
                            }
                            // insert the array with the new groups in the user
                            user[0].groups = groups;
                            // save
                            user[0].save();
                        });
                    }
                });
                // insert the new data
                group.name = req.body.data.name;
                group.description = req.body.data.description;
                group.workspace = req.body.data.workspace;
                group.member = req.body.data.member;
                // save the new data
                group.save();
                // send feedback
                res.send({ status: 'groupUpdated' });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// export router
module.exports = router;