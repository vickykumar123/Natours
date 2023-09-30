const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const viewRouter = express.Router();
// viewRouter.use(authController.isLogged);

viewRouter.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLogged,
  viewsController.getOverview,
);
viewRouter.get('/tour/:slug', authController.isLogged, viewsController.getTour);
viewRouter.get('/login', authController.isLogged, viewsController.getLoginForm);
viewRouter.get('/me', authController.protect, viewsController.getAccount);
viewRouter.get('/my-tour', authController.protect, viewsController.getMyTour);
// viewRouter.post(
//   '/submit-user-data',
//   authController.protect,
//   viewsController.updateData,
// );

module.exports = viewRouter;
