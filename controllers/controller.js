const express = require("express");
const router = express.Router();
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo")
const localStrategy = require("passport-local");
const bcrypt = require("bcrypt")
const users = require("../models/users")
const mongoose = require("mongoose")
require("dotenv").config()

router.use(session({
    secret: process.env.SessionSecret,
    store: MongoStore.create({
        mongoUrl: process.env.ConnectionString,
        touchAfter: 24 * 3600
    }),
    cookie: {
        maxAge: 14 * 24 * 60 * 60 * 1000
    },
    resave: false,
    saveUninitialized: true
}))

router.use(passport.initialize())
router.use(passport.session())

passport.serializeUser((user, done) => {
    done(null, user)
})

passport.deserializeUser((user, done) => {
    users.find({ _id: user._id }).then(userData => {
        done(null, userData)
    })
})

passport.use(new localStrategy(
    (username, password, done) => {
        users.find({ username: username }).then(userData => {
            userData.length > 0 ? bcrypt.compare(password, userData[0].password).then(res => {
                res ? done(null, userData[0]) : done(null, false)
            })
                : done(null, false)
        })
    })
)

router.post("/api/register", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    console.log(username)
    users.find({ username: username }).then(data => {
        if (data.length > 0) {
            return res.status(400).json({ error: "Username already taken" });
        } else if (data.length == 0) {
            bcrypt.hash(req.body.password, 10).then(hash => {
                users.insertMany([{
                    username: username,
                    password: hash,
                }]).then(data => {
                    res.status(201).json({ message: "User registered successfully" });
                });
            })

        }
    });
})
// Login route
router.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json({ message: "Login successful" });
});

// Logout route
router.get("/api/logout", (req, res) => {
    req.logout(err => {
        res.status(200).json({ message: "Logout successful" });
    })

});

// Check if authenticated
router.get("/api/authenticated", (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).json({ authenticated: true });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

router.route("/register").get((req, res, next) => {
    if (req.isAuthenticated() == false) {
        return next();
    } else if (req.isUnauthenticated() == false) {
        res.redirect("/")
    }
}, (req, res) => {
    res.render("register", { error: false, errorStatement: "" })
}).post((req, res) => {
    username = req.body.username
    password = req.body.password

    users.find({ username: username }).then(data => {
        data.length > 0 ? res.render("register", { error: true, errorStatement: "username already taken" })
            :
            bcrypt.hash(password, 10).then(hash => {
                users.insertMany([
                    {
                        username: username,
                        password: hash
                    }
                ])
            })
        res.redirect("/login")
    })
})

router.route("/login").get((req, res, next) => {
    if (req.isAuthenticated() == false) {
        return next();
    } else if (req.isUnauthenticated() == false) {
        res.redirect("/")
    }
}, (req, res) => {
    res.render("login", { error: req.query.error || false, errorStatement: req.query.errorStatement || "" })
}).post(passport.authenticate(
    "local", {
    successRedirect: "/",
    failureRedirect: "/login?error=true&errorStatement=incorrect username or password"
}
))

router.get("/", (req, res, next) => {
    req.isAuthenticated() == true ? next() : res.redirect("/login")
}, (req, res) => {
    res.render("home", { username: req.session.passport.user.username })
})

router.get("/logout", (req, res, next) => {
    req.isAuthenticated() == true ? next() : res.redirect("/login")
}, (req, res) => {
    req.logout(err => {
        res.redirect("/login")
    })
})

module.exports = router