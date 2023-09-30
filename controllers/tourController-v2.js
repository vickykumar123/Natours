// const fs = require('fs');
const Tour = require('../models/tourModel');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8'),
// );

exports.aliasTopCheap = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.field = 'name duration price ratingsAverage difficulty summary';
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    //Build the query
    // 1. Filtering
    const queryObj = { ...req.query };
    const exculde = ['page', 'sort', 'limit', 'field'];
    exculde.forEach((el) => delete queryObj[el]);
    // console.log(req.query, queryObj);

    //2. Advanced Filtering.

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\bgte|gt|lte|le\b/g, (match) => `$${match}`); // result {"duration":{"$gte":"5"},"difficulty":"easy"}
    console.log(queryStr);

    // Use classic mongoDB
    let query = Tour.find(JSON.parse(queryStr));

    // 3. SORTING
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy); // for multiple dependent key
      // query = query.sort(req.query.sort); for only one dependent key
      //sort('price ratingsAverage')

      //- means deceasing order, Example : -price
    } else {
      query = query.sort('-createdAt');
    }

    //4. fields limiting

    if (req.query.field) {
      const selectField = req.query.field.split(',').join(' ');
      query = query.select(selectField);
      //select('name duration price')
    } else {
      query = query.select('-__v'); // - here means exculde the field
    }

    //5. Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numTours = await Tour.countDocuments();
      if (skip >= numTours) throw new Error('Page limit exceed');
    }

    // using moongose
    // const query =  Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

    //Execute the query
    console.log(req.query);

    const tours = await query;

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

exports.createTour = async (req, res) => {
  //1. Method 1
  // const newTour = new Tour({
  //   name: 'The Snow Advent',
  //   price: 450,
  //   rating: 4.8,
  // });
  // newTour.save().then().catch();

  //Method 2
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        tours: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err,
    });
  }
  //   res.send('Done');
};

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
