// import mongoose for schema
const mongoose = require('mongoose');
const date = require('./../important/date');
// create schema
// contains empty (nulled) data for later updates
const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    workspace: {
        type: String,
        required: true
    },
    member: {
        type: Array,
        required: true
    },
    createdAt: {
        type: String,
        default: date.getCurrentDate()
    }
}, { collection: 'groups' });
// export schema
module.exports = mongoose.model('groups', groupSchema);