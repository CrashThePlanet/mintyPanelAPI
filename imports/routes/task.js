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
const login_schema = require('./../schemas/register_access');
const entriesSchema = require('./../schemas/register_entries');
// schma for the task
const taskSchema = require('./../schemas/task');

// define Router
let router = express.Router();
// create noSQL connection
mongoose.connect(process.env.MONGODB_SERVER, { useNewUrlParser: true, useUnifiedTopology: true });
/*  ====
    Code
    ====
*/
// define route to get all tasks (from one user)
router.post('/get', (req, res) => {
    try {
        // check token
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // check if there is an error with the token
            if (err) {
                // send eror
                res.send({ status: 'tokenError' });
                // end function
                return;
            }
            // get all tasks where the editor is the id of the user
            taskSchema.find({ editor: user.id }, (err, tasks) => {
                // check if there is an error
                if (err) {
                    // send error
                    res.send({ status: 'coulNotFindTask' });
                    // end function
                    return;
                }
                // set empty array for the tasks
                tasksArray = [];
                // loop through the tasks
                tasks.forEach((task) => {
                    // check if the tasks is active
                    if (task.status === 'pending') {
                        // push the task with the needed data in the array
                        tasksArray.push({
                            editor: task.editor,
                            status: task.status,
                            shortDesc: task.shortDesc,
                            description: task.description,
                            priority: task.priority,
                            creationDate: task.creationDate,
                            deliveryDate: task.deliveryDate,
                            client: task.client,
                            id: task._id
                        });
                    }
                });
                // find the user
                login_schema.findById(user.id, async(err, userA) => {
                    // check for error
                    if (err) {
                        // send error
                        res.send({ status: 'userNotFound' });
                        // end function
                        return;
                    }
                    // loop through all groups of the user
                    for (const group of userA.groups) {
                        // find the tasks where the editor has the same id as the group
                        await taskSchema.find({ editor: group }, (err, tasksG) => {
                            // check for error
                            if (err) {
                                // send error
                                res.send({ status: 'groupTaskNotFound' });
                                // end function
                                return;
                            }
                            // check if the tasks is active
                            if (tasksG[0] !== undefined && tasksG[0].status === 'pending') {
                                // push the task with the needed data in the array
                                tasksArray.push({
                                    group: tasksG[0].editorName,
                                    editor: tasksG[0].editor,
                                    status: tasksG[0].status,
                                    shortDesc: tasksG[0].shortDesc,
                                    description: tasksG[0].description,
                                    priority: tasksG[0].priority,
                                    creationDate: tasksG[0].creationDate,
                                    deliveryDate: tasksG[0].deliveryDate,
                                    client: tasksG[0].client,
                                    id: tasksG[0]._id
                                });
                            }
                        });
                    }
                    // send feedback and the tasks
                    res.send({ status: 'gotTasks', tasks: tasksArray, lastLogin: user.lastLogin });
                });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to create a new task
router.post('/create', (req, res) => {
    try {
        // verify token
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, async(err, user) => {
            // check if there is an error with the token
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
            // try to insert the new task in the collection
            try {
                // split the user string in the id and the username
                editors = req.body.data.editor2.split('~');
                // put the data of the task in the schema
                task = new taskSchema({
                    editor: editors[0],
                    editorName: editors[1],
                    shortDesc: req.body.data.shortDesc,
                    description: req.body.data.editor,
                    priority: req.body.data.priority,
                    deliveryDate: req.body.data.deliveryDate,
                    client: user.username
                });
                // save the task and wait for it
                await task.save();
                // send feedback
                res.send({ status: 'taskCreated' });
            } catch {
                // if the task couln´d be created
                // send error
                res.send({ status: 'couldNotCreateTask' });
            }
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to get all tasks
router.post('/getall', (req, res) => {
    try {
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                res.send({ status: 'tokenError' });
                return;
            }
            // check if the admin level of the user is not high enough
            if (user.adminLevel !== 3) {
                // send error
                res.send({ status: 'accessDenied' });
                // end function
                return;
            }
            // get all tasks
            taskSchema.find({}, (err, tasks) => {
                // check for error
                if (err) {
                    // send error
                    res.send({ status: 'couldNotFindTask' });
                    // end function
                    return;
                }
                // set empty array for the tasks
                tasksArray = [];
                // loop through the tasks
                tasks.forEach((task) => {
                    // push the task with the needed data in the array
                    tasksArray.push({
                        editor: task.editor,
                        editorName: task.editorName,
                        status: task.status,
                        shortDesc: task.shortDesc,
                        description: task.description,
                        priority: task.priority,
                        creationDate: task.creationDate,
                        deliveryDate: task.deliveryDate,
                        client: task.client,
                        id: task._id
                    });
                });
                // send feedback and the tasks
                res.send({ status: 'gotTasks', tasks: tasksArray });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to delete a task
router.post('/delete', (req, res) => {
    try {
        // check if the token is valid
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // check if there is an error with the token
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
            // find task an delete
            taskSchema.findByIdAndRemove(req.body.id).exec();
            // send feedback
            res.send({ status: 'taskDeleted' });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to get the data of one task
router.post('/getone', (req, res) => {
    try {
        // check if the token is is valid
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // check if there is an error with the token
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
            // find task with the id
            taskSchema.findById(req.body.id, (err, task) => {
                // check if there is an error
                if (err) {
                    // send error 
                    res.send({ status: 'notTaskFound' });
                    // end function
                    return;
                }
                // send feedback and the data of the task
                res.send({
                    status: 'gotData',
                    task: {
                        editor: task.editor,
                        editorName: task.editorName,
                        status: task.status,
                        shortDesc: task.shortDesc,
                        description: task.description,
                        priority: task.priority,
                        creationDate: task.creationDate,
                        deliveryDate: task.deliveryDate,
                        client: task.client
                    }
                });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to update a task
router.post('/update', (req, res) => {
    try {
        // check if the token is valid
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // check if there is an error with the token
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
            // find the task with the id
            taskSchema.findById(req.body.data.id, (err, task) => {
                // check if there is an error
                if (err) {
                    // send error
                    res.send({ status: 'taskNotFound' });
                    // end function
                    return;
                }
                // put hte new data in the task
                task.shortDesc = req.body.data.shortDesc;
                task.description = req.body.data.description;
                task.deliveryDate = req.body.data.deliveryDate;
                task.priority = req.body.data.priority;
                task.status = req.body.data.status;
                // save the new task
                task.save();
                // send feedback
                res.send({ status: 'updateSuccess' });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to update the status of a task
router.post('/deliver', (req, res) => {
    try {
        // check token
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // check if there is an error with the token
            if (err) {
                // send error
                res.send({ status: 'tokenError' });
                // end function
                return;
            }
            // find the task with this id
            taskSchema.findById(req.body.id, (err, doc) => {
                // check if there is an error
                if (err) {
                    // send error
                    res.send({ status: 'noTaskFound' });
                    // end function
                    return;
                }
                // update the status
                doc.status = 'delivered';
                // save it
                doc.save();
                // send feedback
                res.send({ status: 'delivered' });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to get all users
router.post('/editors', (req, res) => {
    try {
        // verify the token
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // check if there is an error
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
            login_schema.find({}, async(err, users) => {
                // check if there is an error
                if (err) {
                    // send error
                    res.send({ status: 'couldNotFindUsers' });
                    // end function
                    return;
                }
                // set empty array for the users
                userArray = [];
                // go through every found user
                users.forEach((user) => {
                    // check if the user is activated
                    if (user.status === 'activated') {
                        // put the id and the username in the array
                        userArray.push({
                            id: user._id,
                            username: user.username
                        });
                    }
                });
                // send feedback and the array
                res.send({ status: 'gotUsers', user: userArray });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// define route to filter the tasks by editor
router.post('/filter', (req, res) => {
    try {
        // check if the token is valid
        jwt.verify(req.body.accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // check if there is an error
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
            // find all tasks with the id of the user as editor
            taskSchema.find({ editor: req.body.editor }, (err, tasks) => {
                // check if there is an error
                if (err) {
                    // send error
                    res.send({ status: 'couldntFindTasks' });
                    // end function
                    return;
                }
                // define empty array for the tasks
                tasksArray = [];
                // loop through the tasks
                tasks.forEach((task) => {
                    // put every task in the array
                    tasksArray.push({
                        editor: task.editor,
                        status: task.status,
                        shortDesc: task.shortDesc,
                        description: task.description,
                        priority: task.priority,
                        creationDate: task.creationDate,
                        deliveryDate: task.deliveryDate,
                        client: task.client,
                        id: task._id
                    });
                });
                // send feedback and the tasks
                res.send({ status: 'gotFilteredTasks', tasks: tasksArray });
            });
        });
    } catch {
        // send an error
        res.send({ status: 'error' });
    }
});
// erport router
module.exports = router;