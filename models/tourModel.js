const mongoose = require('mongoose'); // mongoose is used for mongoDB driver.
const slugify = require('slugify');
const User = require('./userModel');
// const validator = require('validator');

// Creating the schema.
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have name'],
      unique: true,
      maxlength: [40, 'A tour must have less or equal to 40 character'],
      minlength: [10, 'A tour must have more or equal to 10 character'],
      //   validate: [validator.isAlpha, 'Tour name should only contain Char'], // bulit-in validator
    },
    price: {
      type: Number,
      required: [true, 'A tour must have price'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating should be above 1.0'],
      max: [5, 'Rating should be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // this will round the value
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    priceDiscount: {
      type: Number,

      validate: {
        // custom validator
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be less equal to price',
      },
    },
    summary: {
      type: String,
      trim: true, // removes all the white spaces
      require: [true, 'A tour must have summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have imageCover'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // this will hide the field
    },
    startDates: [Date],
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      // Embedded Document
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // guides: Array, // Create Referencing document Parent referencing
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//Indexing to improve the Performance
// tourSchema.index({ price: 1 }); // 1 means ascending, -1 means descending
tourSchema.index({ price: 1, ratingsAverage: -1 }); // 1 means ascending, -1 means descending
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//Virtual Populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', //this field from Review modal
  localField: '_id',
});

// Document Middleware : runs before only .save and .create not for insertMany or others
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); // here we cant use arrow function because of this keyword
  next();
});

//Creating referncing like relational database
// tourSchema.pre('save', async function (next) {
//   const guidePromise = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidePromise);
//   next();
// });
// tourSchema.pre('save', (next) => {
//   console.log('Will save the document....');
//   next();
// });
// // post middleware runs after the pre middleware.
// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

//Query middleware
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  //runs for all find query
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

//Aggregate middle
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  // console.log(docs);
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
