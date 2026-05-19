if (process.env.NODE_ENV !== "production") {
   require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError");

const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");

const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");

const listingRouter = require("./routes/listing");
const reviewRouter = require("./routes/review");
const userRouter = require("./routes/user");

// Config
const dbUrl =
   process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

const PORT = process.env.PORT || 8080;

// MongoDB Connection
async function main() {
   await mongoose.connect(dbUrl);
   console.log("Connected to database");

   app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
   });
}

main().catch((err) => {
   console.log("MongoDB Connection Error:", err);
});

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Session Store
const store = MongoStore.create({
   mongoUrl: dbUrl,
   touchAfter: 24 * 3600,
});

store.on("error", (err) => {
   console.log("Mongo Session Store Error:", err);
});

// Session Config
const sessionOptions = {
   store,
   secret: process.env.SECRET,
   resave: false,
   saveUninitialized: false,
   cookie: {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
   },
};

app.use(session(sessionOptions));
app.use(flash());

// Passport Config
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash + Current User Middleware
app.use((req, res, next) => {
   res.locals.success = req.flash("success");
   res.locals.error = req.flash("error");
   res.locals.currUser = req.user;
   next();
});

// Routes
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// 404 Handler
app.use((req, res, next) => {
   next(new ExpressError(404, "Page Not Found"));
});

// Error Handler
app.use((err, req, res, next) => {
   const { statusCode = 500, message = "Something went wrong" } = err;

   if (res.headersSent) {
      return next(err);
   }

   res.status(statusCode).render("error.ejs", { message });
});