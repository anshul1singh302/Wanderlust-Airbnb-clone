const Listing = require("../models/listing");
const mongoose = require("mongoose");


// Show all listings
module.exports.index = async (req, res) => {
   const allListings = await Listing.find({});
   return res.render("listings/index.ejs", { allListings });
};


// Render new form
module.exports.renderNewForm = (req, res) => {
   return res.render("listings/new.ejs");
};


// Show single listing
module.exports.showListing = async (req, res) => {
   const { id } = req.params;

   if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash("error", "Invalid Listing ID");
      return res.redirect("/listings");
   }

   const listing = await Listing.findById(id)
      .populate({
         path: "reviews",
         populate: {
            path: "author",
         },
      })
      .populate("owner");

   if (!listing) {
      req.flash("error", "Listing does not exist!");
      return res.redirect("/listings");
   }

   return res.render("listings/show.ejs", { listing });
};


// Create listing
module.exports.createListing = async (req, res) => {
   if (!req.file) {
      req.flash("error", "Please upload an image");
      return res.redirect("/listings/new");
   }

   const { path: url, filename } = req.file;

   const newListing = new Listing(req.body.listing);
   newListing.owner = req.user._id;
   newListing.image = { url, filename };

   await newListing.save();

   req.flash("success", "New Listing created!");
   return res.redirect("/listings");
};


// Render edit form
module.exports.renderEditForm = async (req, res) => {
   const { id } = req.params;

   const listing = await Listing.findById(id);

   if (!listing) {
      req.flash("error", "Listing you requested does not exist!");
      return res.redirect("/listings");
   }

   let originalImageUrl = listing.image.url;
   originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

   return res.render("listings/edit.ejs", {
      listing,
      originalImageUrl,
   });
};


// Update listing
module.exports.updateListing = async (req, res) => {
   const { id } = req.params;

   const listing = await Listing.findByIdAndUpdate(id, {
      ...req.body.listing,
   });

   if (req.file) {
      const { path: url, filename } = req.file;
      listing.image = { url, filename };
      await listing.save();
   }

   req.flash("success", "Listing Updated!");
   return res.redirect(`/listings/${id}`);
};


// Delete listing
module.exports.destroyListing = async (req, res) => {
   const { id } = req.params;

   await Listing.findByIdAndDelete(id);

   req.flash("success", "Listing Deleted");
   return res.redirect("/listings");
};