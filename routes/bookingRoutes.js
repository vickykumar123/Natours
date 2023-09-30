const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const bookingRouter = express.Router();

bookingRouter.use(authController.protect);

bookingRouter.get(
  '/checkout-session/:tourId',
  bookingController.getCheckoutSession,
);

bookingRouter
  .route('/')
  .get(bookingController.getAllBooking)
  .post(bookingController.creatBooking);

bookingRouter.use(authController.restrictedTo('admin', 'lead-guide'));

bookingRouter
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = bookingRouter;
