// db/models/endpoints.js

var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;

var endpointsSchema = new Schema({
    hwid: {type: String, unique: true, required: true},
    name: {type: String, required: true},
    location: {type: String, required: true},
    activeUsers: {type: Number, required: true},
    capacity: {type: Number, required: true},
    active: {type: Number, required: true}
});

module.exports = mongoose.model('endpoints', endpointsSchema);