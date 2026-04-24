const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError.js");
const  { listingSchema, reviewSchema } = require("./schema.js");

module.exports.isLoggedIn = (req, res, next) =>{

    if(!req.isAuthenticated()){
      req.session.redirectUrl = req.originalUrl;
      req.flash("error","you must be logged in to create listing!");
      return res.redirect("/login");
   }
   next();
};

module.exports.saveRedirectUrl = (req,res,next) => {
   if(req.session.redirectUrl){
   res.locals.redirectUrl = req.session.redirectUrl;
}
next();
}; 

module.exports.isOwner = async(req, res, next) => {
   let {id} = req.params;
   let listing = await Listing.findById(id);
   if(!listing.owner.equals(res.locals.currUser._id)){
   req.flash("error", "you don't have permission to edit");
   return res.redirect(`/listings/${id}`);
  }
  next();
};  

module.exports.validateListing = (req, res, next) => {
   let { error } = listingSchema.validate(req.body);
   if (error) {
      let errMsg = error.details.map(el => el.message).join(",");
      return next(new ExpressError(400, errMsg));
   }
   next();
};

module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};
module.exports.isReviewAuthor = async (req, res, next) => {
  let { reviewId, id } = req.params;

  let review = await Review.findById(reviewId);

  if (!review) {
    req.flash("error", "Review not found");
    return res.redirect(`/listings/${id}`);
  }

  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You are not the author");
    return res.redirect(`/listings/${id}`);
  }

  next();
};