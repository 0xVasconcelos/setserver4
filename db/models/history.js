// db/models/history.js

var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;

var historySchema = new Schema({
    date: {type: Date, required: true},
    fingerid: {type: String, required: true},
    userid: {type: String, required: true},
    hwid: {type: String, required: true},
    msg: {type: String, required: true},
});

module.exports = mongoose.model('history', historySchema);