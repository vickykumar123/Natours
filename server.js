const mongoose = require('mongoose');
// mongoose is used for mongoDB driver.
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION!! Shutting Down...');
  process.exit(1);
});

dotenv.config({ path: './config.env' }); //you should call before app because .env will not configure

const app = require('./app');
// console.log(app.get('env'));
// console.log(process.env);

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

//CONNECTING TO DATABASE
mongoose // This will return a promise.
  //   .connect(process.env.DATABASE_LOCAL, {
  .connect(DB, {
    // for connecting to remote database
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connected successfully');
  });

// const testTour = new Tour({
//   name: 'The Forest Hiker',
//   price: 500,
//   rating: 4.3,
// });

// testTour
//   .save()
//   .then((con) => console.log(con))
//   .catch((err) => console.log(`ERROR!! 🎇 ${err}`));

// Server listen
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
// app.listen(port, () => {
//   console.log(`App is running on port ${port}`);
// });

//Event Handler
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED ERROR!! Shutting Down...');
  server.close(() => {
    process.exit(1);
  });
});
