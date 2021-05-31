var createError   = require('http-errors');
var express       = require('express');
var path          = require('path');
var cookieParser  = require('cookie-parser');
var logger        = require('morgan');
const passport    = require("passport");
var flash         = require("connect-flash");

var livereload    = require("livereload");
var connectLivereload = require("connect-livereload");

var moment        =   require('moment-timezone');
    moment.tz.setDefault("Asia/Dhaka");

require('dotenv').config({
  path: './.env'
});
// Passport Config
require("./config/passport")(passport);

//oldway
var session  = require('express-session');
// var MemoryStore = require('memorystore')(session);
// var expressSession  = require('express-session')({
//   name : 'codeil',
//   secret: "asdfy98wyrwaejfspdrqyrq234kjhrasudf",
//   resave: false,
//   saveUninitialized: true,
//   // cookie : {
//   //   maxAge:(1000 * 60 * 100)
//   // } 
// });


var publicDirectory = path.join(__dirname, 'public');
// connect to database
var db = require("./config/keys").connection;
db.connect((err) => {
  if (err) {
    // throw err;
    console.log(err);
  } else {
    console.log("Connected to mysql database Kallol...");
  }
});
global.db = db;


var indexRouter = require('./routes/front_end/index');
var usersRouter = require('./routes/front_end/users');
var coursesFrontRouter = require('./routes/front_end/courses_front');
var admissionRouter = require('./routes/front_end/admission');
var certificationRouter = require('./routes/front_end/certification');
var noticeRouter = require('./routes/front_end/notice');
var contactRouter = require('./routes/front_end/contact');
var faqRouter = require('./routes/front_end/faq');
var mailusRouter = require('./routes/front_end/mailus');
var careerRouter = require('./routes/front_end/career');

var systemlogRouter = require('./routes/system_admin/systemlog');
var adminForgetPasswordRouter = require('./routes/system_admin/admin_forget_password');
var resetAdminPasswordRouter = require('./routes/system_admin/reset_admin_password');
var adminRouter = require('./routes/system_admin/admin_login');
var dashboardRouter = require('./routes/system_admin/dashboard');
var courseRouter = require('./routes/system_admin/course');
var addmissionSystemRouter = require('./routes/system_admin/admission');
var AdminCertificateRouter = require('./routes/system_admin/admin_certificate');
var AdminUserRouter = require('./routes/system_admin/admin_user');
var VerificationRouter = require('./routes/system_admin/verification');
var messageRouter = require('./routes/system_admin/admin_message');


// const liveReloadServer = livereload.createServer();
// liveReloadServer.watch(publicDirectory);
// liveReloadServer.server.once("connection", () => {
//   // https://bytearcher.com/articles/refresh-changes-browser-express-livereload-nodemon/
//   setTimeout(() => {
//     liveReloadServer.refresh("/");
//   }, 100);
// });

var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// app.use(connectLivereload());
// Express session
// app.use(expressSession); //oldway
// var sess = {
//   secret: 'keyboard cat',
//   resave: false,
//   saveUninitialized: true,
//   cookie: {
//     maxAge: 86400000, //expired 24h
//     // maxAge: 14400000, //expired 6h
//   },
//   store: new MemoryStore({
//     checkPeriod: 86400000 // prune expired entries every 24h
//     //checkPeriod: 14400000 // prune expired entries every 6h
//   }),
// }
console.log(moment().format('llll'), " = ", app.get('env'));
// if (app.get('env') === 'production') {
//   app.set('trust proxy', 1) // trust first proxy
//   sess.cookie.secure = true // serve secure cookies
// }
// app.use(session(sess));



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  name : 'codeil',
  secret: "asdfy98wyrwaejfspdrqyrq234kjhrasudf",
  resave: false,
  saveUninitialized: true,
  cookie : {
    maxAge:(1000 * 60 * 100)
  } 
}));
app.use(express.static(publicDirectory));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());
// Global variables for flash message
app.use(function (req, res, next) {
  res.locals.success_msg  = req.flash("success_msg");
  res.locals.error_msg    = req.flash("error_msg");
  res.locals.error        = req.flash("error");
  // console.log("success_msg", req.flash("success_msg"));
  // console.log("error_msg", req.flash("error_msg"));
  // console.log("Error", req.flash("error"));
  next();
});



app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/courses-view', coursesFrontRouter);
app.use('/admission', admissionRouter);
app.use('/certification', certificationRouter);
app.use('/notice', noticeRouter);
app.use('/contact', contactRouter);
app.use('/faq', faqRouter);
app.use('/mailus', mailusRouter);
app.use('/career', careerRouter);

app.use('/systemlog', systemlogRouter);
app.use('/admin-forget-password', adminForgetPasswordRouter);
app.use('/reset-admin-password', resetAdminPasswordRouter);
app.use('/admin-login', adminRouter);
app.use('/dashboard', dashboardRouter);
app.use('/course', courseRouter);
app.use('/add-system', addmissionSystemRouter);
app.use('/certificate', AdminCertificateRouter);
app.use('/admin-user', AdminUserRouter);
app.use('/verification', VerificationRouter);
app.use('/message', messageRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('front_view/error');
});


module.exports = app;
