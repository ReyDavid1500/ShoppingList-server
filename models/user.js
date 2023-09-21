const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true,
        unique: [true, "Email Exists..."]
    },
    password: {
        type: String,
        require: true,
        unique: false
    }
});

module.exports = mongoose.model("User", UserSchema); 