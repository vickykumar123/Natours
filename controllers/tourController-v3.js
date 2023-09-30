// const fs = require('fs');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeature');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8'),
// );

const catchAsync = require('../utils/catchAsync');

exports.aliasTopCheap = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.field = 'name duration price ratingsAverage difficulty summary';
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    //Execute the query
    console.log(req.query);

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
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: 'Unable to fetch data',
    });
  }
};

exports.getTour = async (req, res) => {
  //   console.log(req.params);
  //   if (id > tours.length) {

  try {
    const tour = await Tour.findById(req.params.id); // this is equilvent to Tour.findOne({_id:req.params.id})
    //Here id is coming from url /:id
    res.status(200).json({
      status: 'success',
      result: tour.length,
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: 'Unable to fetch data',
    });
  }
};

exports.createTour = catchAsync(async (req, res) => {
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
  //   res.send('Done');
});

exports.updateTour = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err,
    });
  }
};

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
