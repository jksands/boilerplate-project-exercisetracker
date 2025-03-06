const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const { type } = require('express/lib/response');
require('dotenv').config();
const mongoose = require('mongoose');

// Connect to DB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }
);


const Schema = mongoose.Schema;

// Useful schemas
const exerciseSchema = new Schema({
  username: {type:String, required:true},
  description: {type:String, required:true},
  duration: {type:Number, required:true},
  date: {type:String, required:true}
  // _id should be autopopulated  
});

const userSchema = new Schema({
  username: {type:String, required:true},
  count: {type:Number},
  log: [exerciseSchema]
  // description: {type:String},
  // duration: {type:Number},
  // date: {type:String}  
  // _id should be autopopulated
});



let User = mongoose.model("User", userSchema);
let Exercise = mongoose.model("Exercise", exerciseSchema);

// DANGER: THIS CLEARS ENTIRE DATABSE BEFORE USE
User.deleteMany({}, (err) => {
  if (err) console.log(err);
})
Exercise.deleteMany({}, (err) => {
  if (err) console.log(err);
})

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', (req, res) => {
  // Simply create user and send to database
  let self = new User({
    username: req.body.username
  });
  self.save((err, data) => {
    if (err) return console.error(err);
    console.log("User saved: " + self.username);
    res.json(data);
  })
})

app.get('/api/users', (req, res) => {
  // res.send(users);
  User.find({}, (err, matches) => {
    if (err) return console.error(err);
    res.send(matches);
  })
})

app.post('/api/users/:_id/exercises', (req, res) => {
    User.findById(req.params._id, (err, result) => {
      if (err) return console.error(err);
      let user = result;
      let e = new Exercise({
        username: user.username,
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date ? req.body.date : new Date(Date.now()).toDateString(),
        _id: user._id
      });
      user.log.push(e);
      user.count = user.log.length;
      // user.description = req.body.description;
      // user.duration = req.body.duration;
      // user.date = req.body.date ? req.body.date : new Date(Date.now()).toDateString();
      user.save((err, data) => {
        if (err) return console.error(err);
        res.json(e);
      })
    })
    
})

app.get('/api/users/:_id/logs', (req, res) => {
  // res.json();
  User.findById(req.params._id, (err, result) => {
    if (err) return console.error(err);
    if (req.query) {
      console.log(req.query);
      console.log("BEFORE: " + result.log);
      // First, filter by dates that fall within the range
      let from = req.query.from ? Date.parse(req.query.from) : 0;
      let to = req.query.to ? Date.parse(req.query.to) : Number.MAX_VALUE;
      result.log = result.log.filter(l => {
        let d = Date.parse(l.date);
        console.log(l.date, d, to, from);
        return d > from && d < to;
      });
      console.log("AFTER: " + result.log);
      if (req.query.limit) result.log = result.log.slice(0, req.query.limit);
    }
    res.json(result);
  })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
