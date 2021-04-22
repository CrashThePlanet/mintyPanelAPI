// import mongoose for schema
const mongoose = require('mongoose');
const date = require('./../important/date');
// create schema
// contains empty (nulled) data for later updates
const userSchema_access = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    adminLevel: {
        type: Number,
        default: 1,
    },
    status: {
        type: String,
        default: 'notActivated'
    },
    lastLogin: {
        type: String,
        default: null
    },
    redirect: {
        type: Boolean,
        default: false
    },
    doneDataComp: {
        type: Boolean,
        default: false
    },
    groups: {
        type: Array,
        deafult: null,
    },
    createdAt: {
        type: String,
        default: date.getCurrentDate()
    },
    refreshToken: {
        type: String,
        default: null
    }
    // schmea inserts in existing collection
}, { collection: 'access' });
// export schema
module.exports = mongoose.model('access', userSchema_access);