var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var i18n = require('./util/i18n');

// const passport = require('passport');
// var mypage = require('./routes/mypage/mypageRoute');

/* =======================
    LOAD THE CONFIG
==========================*/
process.env.NODE_ENV = ( process.env.NODE_ENV && ( process.env.NODE_ENV ).trim().toLowerCase() == 'production' ) ? 'production' : 'development';

// 전역변수 선언
if (process.env.NODE_ENV == 'production') {
  console.log("Production Mode");
  global.config = require('./config/prod.conf')
} else if (process.env.NODE_ENV == 'development') {
  console.log("Development Mode");
  global.config = require('./config/dev.conf')
}

// 인증 미들웨어(구현)
// require('./util/passport');

/* =======================
    EXPRESS CONFIGURATION
==========================*/
var app = express();

var AWSXRay = require('aws-xray-sdk');
app.use(AWSXRay.express.openSegment('MyApp'));

// // home
// app.get('/', function(req, res) {
//   res.render('temp');
// })

// router.get('/official', function(req, res, next) {
//   res.render('official', { layout: './layout/official-layout' });
// });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(i18n);

//set the layouts
const expressLayouts = require('express-ejs-layouts');
// ejs-layouts setting
app.set('layout', './layout/layout');
app.set("layout extractScripts", true);
app.use(expressLayouts);

// set the secret key variable for jwt
app.set('jwt-secret', config.secret)

app.get('/', function(req, res) {
  res.render('main', {layout: './layout/main-layout', target: ''});
  //res.redirect('/official');
});

app.use(AWSXRay.express.closeSegment());

app.use('/', require('./routes/index'));

// configure api router
app.use('/api', require('./routes/api/index'));
app.use('/board', require('./routes/board/boardRoute'));
app.use('/join', require('./routes/join/joinRoute'));
app.use('/login', require('./routes/login/loginRoute'));
// app.use('/mypage/profile', passport.authenticate('jwt', {session: false}), mypage);
app.use('/mypage', require('./routes/mypage/mypageRoute'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  //next(createError(404));
  res.render('404',{ layout: './layout/single-layout' });
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error',{ layout: './layout/single-layout' });
});

module.exports = app;
