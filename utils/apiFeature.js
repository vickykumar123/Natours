class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const exculde = ['page', 'sort', 'limit', 'field'];
    exculde.forEach((el) => delete queryObj[el]);
    // console.log(req.query, queryObj);

    //2. Advanced Filtering.

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\bgte|gt|lte|le\b/g, (match) => `$${match}`); // result {"duration":{"$gte":"5"},"difficulty":"easy"}

    // Use classic mongoDB
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy); // for multiple dependent key
      // query = query.sort(req.query.sort); for only one dependent key
      //sort('price ratingsAverage')

      //- means deceasing order, Example : -price
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitField() {
    if (this.queryString.field) {
      const selectField = this.queryString.field.split(',').join(' ');
      this.query = this.query.select(selectField);
      //select('name duration price')
    } else {
      this.query = this.query.select('-__v'); // - here means exculde the field
    }
    return this;
  }

  pagination() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
