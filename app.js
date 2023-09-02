const express = require("express");
const app = express();
const controller = require("./controllers/controller")
app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: false }))
app.use(express.static("public"))
app.listen(process.env.PORT || 2000)
app.use("/", controller)
