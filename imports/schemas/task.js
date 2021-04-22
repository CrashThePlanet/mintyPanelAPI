// import mongoose for schema
const mongoose = require('mongoose');
const date = require('./../important/date');
// create schema
// contains empty (nulled) data for later updates
const taskSchema = new mongoose.Schema({
    editor: {
        type: String,
        required: true
    },
    editorName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'pending'
    },
    shortDesc: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        default: 'low'
    },
    creationDate: {
        type: String,
        default: date.getCurrentDate()
    },
    deliveryDate: {
        type: String,
        default: 'indefinite'
    },
    client: {
        type: String,
        required: true
    }
}, { collection: 'tasks' });
// export schema
module.exports = mongoose.model('tasks', taskSchema);