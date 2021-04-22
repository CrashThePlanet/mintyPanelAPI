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
// module to read files
const fs = require('fs');

// get schema to get user
const accessSchema = require('./../schemas/register_access');
const entriesSchma = require('./../schemas/register_entries');
const taskSchema = require('./../schemas/task');

// define Router
let router = express.Router();
// create noSQL connection
mongoose.connect(process.env.MONGODB_SERVER, { useNewUrlParser: true, useUnifiedTopology: true });
/*  ====
    Code
    ====
*/
// define route to get the update notes
router.post('/updates', (req, res) => {
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
            // path to the update note files
            updatePath = './updateNotes/';
            // get all files in the folder
            var files = fs.readdirSync(updatePath);
            // read the first file
            fs.readFile(updatePath + files[0], 'utf8', (err, data) => {
                // check for error
                if (err) {
                    // send error
                    res.send({ status: 'noUpdatesFound' });
                    // end function
                    return;
                }
                // send feedback and the update notes
                res.send({ status: 'updatesFound', updates: data });
            });
        });
    } catch {
        res.send({ status: 'error' });
    }
});
// erport router
module.exports = router;