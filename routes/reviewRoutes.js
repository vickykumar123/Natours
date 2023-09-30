const express = require('express');

const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const reviewRouter = express.Router({ mergeParams: true }); // mergeParams will provide the access to tourRouter params

reviewRouter.use(authController.protect);

reviewRouter
  .route('/')
  .get(reviewController.getAllReview)
  .post(
    authController.protect,
    authController.restrictedTo('user'),
    reviewController.createReview,
  );

reviewRouter
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictedTo('user', 'admin'),
    reviewController.updateReview,
  )
  .delete(
    authController.restrictedTo('user', 'admin'),
    reviewController.deleteReview,
  );

module.exports = reviewRouter;
