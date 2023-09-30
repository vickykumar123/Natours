const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');

//OPtion1
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // cb == callBack()
//     cb(null, 'public/img/users'); // cb(error,destinationPath)
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

//Option2
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image🤔,Please upload an Image', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter }); // to upload users image
exports.uploadUserImg = upload.single('photo');

//If using option 1(diskStorage) dont use this
exports.resizeUserImg = catchAsync(async (req, res, next) => {
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  if (!req.file) return next();
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedObj) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedObj.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
// exports.getAllUsers = catchAsync(async (req, res) => {
//   const users = await User.find();

//   res.status(201).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users,
//     },
//   });
// });

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
  //1. reject if it contains the password
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError('Please update the password from /updateMyPassword', 401),
    );

  //2. update the document
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This api is not yet defined !!',
  });
};
