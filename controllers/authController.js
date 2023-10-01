const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

function signInToken(id) {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TOKEN_EXPIRES_IN,
  });
}

function creatSendJWTToken(user, statusCode, res) {
  const token = signInToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ), // hour*min*sec*milliSec
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  //remove the password
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
}

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser= await User.create(req.body) ==> this will create login flaw, everyone can send admin role to true
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelCome();
  creatSendJWTToken(newUser, 201, res);
});

//LOGIN
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1. check email and password exist
  if (!email || !password)
    return next(
      new AppError('Please provide the vaild email and password', 400),
    );

  // 2. Check user exist and password is correct
  const user = await User.findOne({ email }).select('+password');
  // const correct = await user.correctPassword(password, user.password); if user dont exist it will throw undefined

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //3 . if everything is correct send the response
  creatSendJWTToken(user, 201, res);
});

//Logout
exports.logout = (req, res) => {
  res.cookie('jwt', 'LoggedOut', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  //1. check if token exist
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in, Please login to get access', 401),
    );
  }
  //2. Verfication of token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  //3. Check if user exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError('The user belonging to this token does not exists'),
    );

  //4. Check if user changed the password after generating the token
  if (currentUser.checkChangedPassword(decoded.iat)) {
    return next(
      new AppError('User recently changed the password!, Please login again'),
    );
  }

  //Grant the access
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

//Check if Logged in only for render
exports.isLogged = async (req, res, next) => {
  //1. check if token exist
  if (req.cookies.jwt) {
    //2. Verfication of token
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );
      // console.log(decoded);

      //3. Check if user exist
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) return next();

      //4. Check if user changed the password after generating the token
      if (currentUser.checkChangedPassword(decoded.iat)) {
        return next();
      }

      //There is a logged in user
      res.locals.user = currentUser;
      // req.user = currentUser;

      return next();
    } catch (err) {
      //There is no logged in user
      return next();
    }
  }
  next();
};

exports.restrictedTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You dont have required permission', 403));
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1. get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("Can't find the user with that email ", 404));
  }

  //2. generate the random token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3. send it via mail
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/resetPassword/${resetToken}`;

  // const message = `Forgot your password! Please reset using the below reset password link ${resetURL}\n If not forgot the password ignore this mail`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Reset your password (valid for 10min)',
    //   message,
    // });

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Reset password url sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpries = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Error in sending email, Please try again!', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. get the user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpries: { $gt: Date.now() },
  });
  //2. if token not expired and user exists,then set the password
  if (!user) {
    return next(new AppError('Invalid token or Token has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpries = undefined;
  await user.save();

  //3. update passwordChangedAt property of the user
  //4. log the user using JWT
  creatSendJWTToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1. Get the user from collection

  const user = await User.findById(req.user.id).select('+password');
  //2.Check if posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Incorrect current password'));
  }
  //3. if so, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  // user.passwordChangedAt = Date.now() - 1000; this will come from the pre middleware
  await user.save();
  //4. Send the JWT token

  creatSendJWTToken(user, 200, res);
});
