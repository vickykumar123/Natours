const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp'); //http parameter posioning
const cors = require('cors');

const AppError = require('./utils/appError');
const errorController = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
const compression = require('compression');
const bookingController = require('./controllers/bookingController');

const app = express();
app.enable('trust proxy');

app.use(express.static(`${__dirname}/public`)); //this will render public folder html
//Setting up pug template
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//MiddleWare
//CORS
app.use(cors());
//Set security headers
// Further HELMET configuration for Security Policy (CSP)
const scriptSrcUrls = ['https://unpkg.com/', 'https://tile.openstreetmap.org'];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
];
const connectSrcUrls = ['https://unpkg.com', 'https://tile.openstreetmap.org'];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// Set security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:', ...fontSrcUrls],
        scriptSrc: [
          "'self'",
          'https:',
          'http:',
          'blob:',
          'https://*.mapbox.com',
          'https://js.stripe.com',
          'https://m.stripe.network',
          'https://*.cloudflare.com',
          ...scriptSrcUrls,
        ],
        frameSrc: ["'self'", 'https://js.stripe.com'],
        objectSrc: [],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'", ...styleSrcUrls],
        workerSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.tiles.mapbox.com',
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://m.stripe.network',
        ],
        childSrc: ["'self'", 'blob:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        formAction: ["'self'"],
        connectSrc: [
          "'self'",
          "'unsafe-inline'",
          'data:',
          'blob:',
          'https://*.stripe.com',
          'https://*.mapbox.com',
          'https://*.cloudflare.com/',
          'https://bundle.js:*',
          'ws://127.0.0.1:*/',
          ...connectSrcUrls,
        ],
        upgradeInsecureRequests: [],
      },
    },
  }),
);

// app.use(helmet());

app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout,
);
// app.use(express.json()); // middleware to send the post request
//Body Parser
app.use(express.json({ limit: '10kb' })); //this limit the data that is coming from the body to stop DDOS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//Data sanitization against NoSQL injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

// http parameter posioning
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsQuantity',
      'difficulty',
      'price',
      'ratingsAverage',
    ],
  }),
);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// app.use((req, res, next) => {
//   console.log('Hello from middleWare 👋🏻');
//   next();
// });

//Rate Limit the api request
const limiter = rateLimit({
  validate: { trustProxy: false },
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request to the api, Please try again after 1 hour',
});

app.use('/api', limiter);

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// app.get('/', (req, res) => {
//   //   res.status(200).send('Hello from the server side...');
//   res
//     .status(200)
//     .json({ message: 'Hello from the server side...', app: 'Natours' });
// });

// app.post('/', (req, res) => {
//   res.send('You can post to this endpoint...');
// });

// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);
// app.get('/api/v1/tours/:id', getTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

//Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/review', reviewRouter);
app.use('/api/v1/booking', bookingRoutes);
app.use('/', viewRouter);
app.use(compression());

app.all('*', (req, res, next) => {
  //Error Handling methods
  //1..
  //   res.status(404).json({
  //     status: 'failed',
  //     message: `Can't find the url ${req.originalUrl}`,
  //   });

  //2..
  //   const err = new Error(`Can't find the url ${req.originalUrl}`);
  //   err.status = 'fail';
  //   err.statusCode = 404;

  //3..
  const err = new AppError(`Can't find the url ${req.originalUrl}`, 404);

  next(err); //if we pass any parameter inside the next, express will automatically come to that any error as occured.
});

//Gobal error handler
app.use(errorController);

module.exports = app;
