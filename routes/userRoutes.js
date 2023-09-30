const express = require('express');

const userRouter = express.Router();
const {
  getAllUsers,
  createUsers,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserImg,
  resizeUserImg,
} = require('../controllers/userController');
const authController = require('../controllers/authController');

// userRouter.post('/signup', authController.signup); or
userRouter.route('/signup').post(authController.signup);
userRouter.route('/login').post(authController.login);
userRouter.route('/logout').get(authController.logout);
userRouter.route('/forgotPassword').post(authController.forgotPassword);
userRouter.route('/resetPassword/:token').patch(authController.resetPassword);

userRouter.use(authController.protect); // from this point all the route will be protected, This will work because middleware runs in sequence

userRouter
  .route('/updateMyPassword')
  .patch(authController.protect, authController.updatePassword);

userRouter.route('/me').get(getMe, getUser);
userRouter.route('/updateMe').patch(uploadUserImg, resizeUserImg, updateMe); // here 'photo' is field from database
userRouter.route('/deleteMe').delete(authController.protect, deleteMe);

userRouter.use(authController.restrictedTo('admin'));

userRouter.route('/').get(getAllUsers).post(createUsers);
userRouter.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = userRouter;
