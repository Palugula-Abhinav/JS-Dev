const mongoose = require("mongoose")
require("dotenv").config()

mongoose.connect(process.env.ConnectionString, { useNewUrlParser: true })

let userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model("user", userSchema)