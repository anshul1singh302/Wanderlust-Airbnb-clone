const express = require("express");
const WrapAsync = require("../utils/WrapAsync"); // ✅ correct path
const router = express.Router();
const User = require("../models/user.js");       // ✅ correct path 
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");

const userController = require("../controllers/users.js");

router.route("/signup")
.get(
     userController.renderSignupForm
    )
    .post(
     WrapAsync(userController.signup)
);

router.route("/login")
.get(
    userController.renderLoginForm
)
.post(
    saveRedirectUrl,
    passport.authenticate("local",{
    failureRedirect: "/login",
    failureFlash: true,
 }),
userController.login
);
 
router.get("/logout",userController.logout);


module.exports = router;