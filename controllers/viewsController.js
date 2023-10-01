const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  const tour = await Tour.findOne({ slug }).populate({
    path: 'reviews',
    fields: 'review name rating',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Login',
  });
};

exports.getSignupForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'Sign-Up',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'My Account',
  });
};

exports.getMyTour = catchAsync(async (req, res) => {
  const booking = await Booking.find({ user: req.user.id });

  const tourIDs = booking.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  // console.log(tours);

  res.status(200).render('overview', {
    title: 'My Booking',
    tours,
  });
});

// exports.updateData = catchAsync(async (req, res) => {
//   res.status(200).render('account', {
//     title: 'My Account',
//     user: updatedUser,
//   });
// });
