// db/models/users.js

var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;

var usersSchema = new Schema({
    name: {type: String, required: true},
    roles: {type: Array, required: true},
    userid: {type: String, unique: true, required: true},
    email: {type: String, unique: true, required: true},
    username: {type: String, unique: true, required: true},
    password: {type: String, required: true}
});

module.exports = mongoose.model('users', usersSchema);