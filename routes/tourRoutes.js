const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
// const reviewController = require('../controllers/reviewController');
const reviewRouter = require('./reviewRoutes');

const tourRouter = express.Router();

const { getAllTours, createTour, getTour, updateTour, deleteTour } =
  tourController;

// tourRouter.param('id', tourController.checkId);

//Nested route
// tourRouter
//   .route('/:tourId/review')
//   .post(
//     authController.protect,
//     authController.restrictedTo('user'),
//     reviewController.createReview,
//   );

tourRouter.use('/:tourId/review', reviewRouter);

tourRouter.route('/top-5-cheap').get(tourController.aliasTopCheap, getAllTours);
tourRouter.route('/tour-stats').get(tourController.getStats);
tourRouter
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getTourWithin);
tourRouter
  .route('/distance/:latlng/unit/:unit')
  .get(tourController.getDistance);

tourRouter
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan,
  );

tourRouter
  .route('/')
  .get(getAllTours)
  .post(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide'),
    createTour,
  );
// .post(tourController.checkBody, createTour);

tourRouter
  .route('/:id')
  .get(getTour)
  .patch(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide'),
    tourController.uploadTourImg,
    tourController.resizeImages,
    updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide'),
    deleteTour,
  );

module.exports = tourRouter;
