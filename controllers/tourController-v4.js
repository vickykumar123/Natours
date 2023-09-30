// const fs = require('fs');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeature');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handleFactory');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8'),
// );

exports.aliasTopCheap = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.field = 'name duration price ratingsAverage difficulty summary';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour, req.query)
    .filter()
    .sort()
    .limitField()
    .pagination();
  const tours = await features.query;

  //Send Response
  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      tours,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //   console.log(req.params);
  //   if (id > tours.length) {

  // const tour = await Tour.findById(req.params.id).populate({
  //   path: 'guides',
  //   select: '-__v -passwordChangedAt',
  // });
  const tour = await Tour.findById(req.params.id).populate({
    path: 'reviews',
    select: 'review',
  });
  // this is equilvent to Tour.findOne({_id:req.params.id})
  //Here id is coming from url /:id

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    result: tour.length,
    data: {
      tour,
    },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  //1. Method 1
  // const newTour = new Tour({
  //   name: 'The Snow Advent',
  //   price: 450,
  //   rating: 4.8,
  // });
  // newTour.save().then().catch();

  //Method 2
  // try {

  // } catch (err) {
  //   res.status(400).json({
  //     status: 'failed',
  //     message: err,
  //   });
  // }

  // Method 3
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      tours: newTour,
    },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tours = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(201).json({
    status: 'success',
    data: {
      tours,
    },
  });
});

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   await Tour.findByIdAndDelete(req.params.id);
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

exports.getStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      { $match: { ratingsAverage: { $gte: 4.5 } } },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          numTours: { $sum: 1 },
          numRating: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      { $sort: { avgPrice: 1 } },
      // { $match: { _id: { $ne: 'EASY' } } },
    ]);

    res.status(201).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = Number(req.params.year);
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numsTourStart: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: { numsTourStart: -1 },
      },
      {
        $limit: 12,
      },
    ]);
    res.status(201).json({
      status: 'success',
      data: {
        plan,
      },
    });
  } catch (err) {
    res.status(401).json({
      status: 'failed',
      message: err,
    });
  }
};
