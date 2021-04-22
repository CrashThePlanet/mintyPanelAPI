// import mongoose for schema
const mongoose = require('mongoose');
const date = require('./../important/date');
// create schema
// contains empty (nulled) data for later updates
const requestSchema = new mongoose.Schema({
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
    username: {
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
    secondEmail: {
        type: String,
        default: null
    },
    redirect: {
        type: Boolean
    },
    notes: {
        type: String,
        default: null
    },
    dateOfRequest: {
        type: String,
        default: date.getCurrentDate()
    },
    status: {
        type: String,
        default: 'nothing'
    },
    message: {
        type: String,
        deafult: null,
    }
    // schmea inserts in existing collection
}, { collection: 'entries_change_request' });
// export schema 
module.exports = mongoose.model('entries_change_request', requestSchema);