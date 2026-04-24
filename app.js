
if (process.env.NODE_ENV !== "production") {
   require("dotenv").config();
}


const express = require("express");
const router = express.Router({ mergeParams: true });
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");




const session = require ("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const user = require("./models/user.js");

const listingRouter = require('./routes/listing.js');
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const { url } = require("inspector");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";



main()
 .then(() => {
    console.log("Connected to daatabase");
 })
 .catch((err) =>{ console.log(err)   
 });

 async function main(){
    await mongoose.connect(MONGO_URL);
 }

 app.set("view engine","ejs");
 app.set("views", path.join (__dirname,"views"));
 app.use(express.urlencoded({extended: true}));
 app.use(express.urlencoded({ extended: true }));
 app.use(express.json());
 app.use(methodOverride("_method"));
 app.engine("ejs", ejsMate);
 app.use(express.static(path.join(__dirname,"/public"))); 

 const sessionOption = {
   secret: "mysupersecretcode",
   resave: false,
   saveUninitialized: true,
   cookie:{
      express: Date.now() + 4 * 24 * 60 * 60 * 1000,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
   },
 };

 


 app.use(session(sessionOption));
 app.use(flash());

 app.use (passport.initialize());
 app.use (passport.session());
 passport.use(new LocalStrategy(user.authenticate()));

 passport.serializeUser(user.serializeUser());
 passport.deserializeUser(user.deserializeUser());

 app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  
  next();
});



app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/",userRouter);

app.use((req, res, next) => {
  next(new ExpressError(404, "page not found !"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error.ejs",{message}); 
});


app.listen(8080, () => {
   console.log("sever is listing to port 8080");
});
