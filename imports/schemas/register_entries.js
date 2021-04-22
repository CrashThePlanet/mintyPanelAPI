// import mongoose for schema
const mongoose = require('mongoose');
const date = require('./../important/date');
// create schema
// contains empty (nulled) data for later updates
const userSchema_entries = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    forname: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    birthDate: {
        type: String,
        default: null
    },
    nickname: {
        type: String,
        required: true
    },
    postCode: {
        type: String,
        default: null
    },
    place: {
        type: String,
        default: null
    },
    houseNumber: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    email: {
        type: String,
        required: true
    },
    secondEmail: {
        type: String,
        default: null
    },
    job: {
        type: String,
        default: null
    },
    username: {
        type: String,
        required: true,
    },
    notes: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    lastRequest: {
        type: String,
        default: null
    }
    // schmea inserts in existing collection
}, { collection: 'entries' });
// export schema 
module.exports = mongoose.model('entries', userSchema_entries);