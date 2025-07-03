const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const app = express();
let vehicles = [];
let id = 1;

// Dummy user (you can replace with DB users later)
const users = [{ id: 1, username: 'admin', password: '1234' }];

// View engine + static
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));

// Session + Passport
app.use(session({ secret: 'mysecret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Passport local strategy
passport.use(new LocalStrategy((username, password, done) => {
  const user = users.find(u => u.username === username);
  if (!user) return done(null, false, { message: 'Incorrect username.' });
  if (user.password !== password) return done(null, false, { message: 'Incorrect password.' });
  return done(null, user);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = users.find(u => u.id === id);
  done(null, user);
});

// Middleware to protect routes
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// ROUTES

// Login form
app.get('/login', (req, res) => {
  res.render('login');
});

// Handle login
app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

// Logout
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login');
});

// Home - Read all (protected)
app.get('/', isAuthenticated, (req, res) => {
  res.render('index', { vehicles });
});

// New form
app.get('/vehicles/new', isAuthenticated, (req, res) => {
  res.render('new');
});

// Create
app.post('/vehicles', isAuthenticated, (req, res) => {
  const { vehicleName, price, image, desc, brand } = req.body;
  vehicles.push({ id: id++, vehicleName, price, image, desc, brand });
  res.redirect('/');
});

// Edit form
app.get('/vehicles/edit/:id', isAuthenticated, (req, res) => {
  const vehicle = vehicles.find(v => v.id == req.params.id);
  res.render('edit', { vehicle });
});

// Update
app.post('/vehicles/update/:id', isAuthenticated, (req, res) => {
  const { vehicleName, price, image, desc, brand } = req.body;
  const index = vehicles.findIndex(v => v.id == req.params.id);
  vehicles[index] = { id: parseInt(req.params.id), vehicleName, price, image, desc, brand };
  res.redirect('/');
});

// Delete
app.post('/vehicles/delete/:id', isAuthenticated, (req, res) => {
  vehicles = vehicles.filter(v => v.id != req.params.id);
  res.redirect('/');
});

// API endpoint for JSON (protected)
app.get('/api/vehicles', isAuthenticated, (req, res) => {
  res.json(vehicles);
});

// Start server
app.listen(4000, () => console.log('Server running at http://localhost:4000'));



