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
// mongoose schemas
const entries_user = require('./../schemas/register_entries');
const access_user = require('./../schemas/register_access');
// define Router
let router = express.Router();
// create noSQL connection
mongoose.connect(process.env.MONGODB_SERVER, { useNewUrlParser: true, useUnifiedTopology: true });
/*  ====
    Code
    ====
*/
// define main router
router.post('/', async(req, res) => {
    // try to create user
    try {
        // use timestamp as id
        const id_timestamp = Date.now().toString();
        // create user access collection using schema
        const user_access = new access_user({
            id: id_timestamp,
            // create username from requestdata
            username: req.body.forname.toLowerCase() +
                '.' + req.body.surname.toLowerCase(),
            // hash password
            password: await bcrypt.hash(req.body.password, 10)
        });
        // wait to save the data in collection
        await user_access.save();
        // create user entries collection using schema
        const user_entries = new entries_user({
            id: id_timestamp,
            // get data from request
            forname: req.body.forname,
            surname: req.body.surname,
            nickname: req.body.nickname,
            email: req.body.email,
            // create username from requestdata
            username: req.body.forname.toLowerCase() +
                '.' + req.body.surname.toLowerCase()
        });
        // wait to save the data in collection
        await user_entries.save();
        // return with successfull code an feedback
        res.status(200).send({ status: 'userCreated' });
        // if error, send error code 500 with errormassege
    } catch {
        res.status(500).send({ status: 'userNotCreated' });
    }
});
// erport router
module.exports = router;