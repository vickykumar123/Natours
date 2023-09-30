const APIFeatures = require('../utils/apiFeature');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //Small hack for reviewController
    let filterTour = {};
    if (req.params.tourId) filterTour = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filterTour), req.query)
      .filter()
      .sort()
      .limitField()
      .pagination();
    // const docs = await features.query.explain();
    const docs = await features.query;

    //Send Response
    res.status(200).json({
      status: 'success',
      result: docs.length,
      data: {
        docs,
      },
    });
  });

exports.getOne = (Model, popOption) =>
  catchAsync(async (req, res, next) => {
    //   console.log(req.params);
    //   if (id > tours.length) {

    // const tour = await Tour.findById(req.params.id).populate({
    //   path: 'guides',
    //   select: '-__v -passwordChangedAt',
    // });
    let query = Model.findById(req.params.id);
    if (popOption) {
      query = query.populate(popOption);
    }

    // this is equilvent to Tour.findOne({_id:req.params.id})
    //Here id is coming from url /:id
    const docs = await query;
    if (!docs) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      result: docs.length,
      data: {
        docs,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const docs = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        tours: docs,
      },
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(201).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const docs = await Model.findByIdAndDelete(req.params.id);

    if (!docs) {
      return next(new AppError('No document found with that id...', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
