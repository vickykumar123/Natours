const fs = require('fs');

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8'),
);

exports.checkId = (req, res, next, val) => {
  // console.log(`Id is ${val}`);
  if (Number(req.params.id) > tours.length) {
    return res.status(404).json({
      status: 'failed',
      message: 'Invaild Id',
    });
  }
  next();
};

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'failed',
      message: 'Missing name or price',
    });
  }
  next();
};

exports.getAllTours = (req, res) => {
  // console.log(req.requestTime);
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    result: tours.length,
    data: {
      tours,
    },
  });
};

exports.getTour = (req, res) => {
  //   console.log(req.params);

  const id = Number(req.params.id);

  const tour = tours.find((el) => el.id === id);
  //   if (id > tours.length) {
  if (!tour) {
    return res.status(404).json({
      status: 'failed',
      message: 'Invaild Id',
    });
  }
  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      tour,
    },
  });
};

exports.createTour = (req, res) => {
  //   console.log(req.body);
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body); // this equilvant to {...{id:newId},req.body}
  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tours: newTour,
        },
      });
    },
  );
  //   res.send('Done');
};

exports.updateTour = (req, res) => {
  res.status(201).json({
    status: 'success',
    data: {
      tour: '<Updated Successfully>',
    },
  });
};

exports.deleteTour = (req, res) => {
  res.status(204).json({
    status: 'success',
    data: null,
  });
};
