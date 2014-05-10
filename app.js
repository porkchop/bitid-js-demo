var debug = require('debug')('bitid-js-demo')
  , express = require('express')
  , http = require('http')
  , path = require('path')
  , url = require('url')
  , logger = require('morgan')
  , bodyParser = require('body-parser')
  , partials = require('express-partials')
  , Bitid = require('bitid')
  , db = require('./db')
  , app = express()
  , server = http.createServer(app)
  , sessionConfig = {
    secret: 'bitid-js-demo super secret',
    key: 'express.sid',
    store: new express.session.MemoryStore()
  }
  , port = process.env.PORT || 3000
  , siteURL = process.env.SITEURL || 'http://localhost:3000'
  , callbackURL = siteURL + '/callback';


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.cookieParser());
app.use(express.session(sessionConfig));
app.use(partials());

app.use(deserializeUser);
app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.set('port', port);
server.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});


app.locals.callbackIndexPath = '/callback';
app.locals.callbackIndexUrl = callbackURL;

app.get('/logout', function(req, res) {
  req.session.uid = null;
  res.redirect('/');
});

app.get('/', function(req, res) {res.render('index.ejs')});

app.get('/login', function(req, res) {
  if(req.user) return res.redirect('/user');

  var nonce = db.nonces.find(function(nonce) {return nonce.sid === req.sessionID;}) || db.nonces.create(req.sessionID)
    , bitid = new Bitid({nonce: nonce.id, callback: callbackURL, unsecure: true});

  res.render('login', {
    nonce: nonce.id,
    bitid: bitid
  });
});

app.get('/user', ensureAuthenticated, function(req, res) {
  res.render('user', req.user);
});

app.post('/callback', function(req, res) {
  var params = req.body
    , address = params.address
    , bitid = new Bitid({uri:params.uri, signature:params.signature, address:address, callback:callbackURL});

  if(!bitid.uriValid()) res.json(401, {message: "BitID URI is invalid or not legal"});
  else if(!bitid.signatureValid()) res.json(401, {message: "Signature is incorrect"});
  else {
    var nonce = db.nonces.get(bitid.nonce);
    if(!nonce) res.json(401, {message: "NONCE is illegal"});
    else if(nonce.expired()) res.json(401, {message: "NONCE has expired"});
    else {
      var user = db.users.find(function(user) {return user.address === address;}) || db.users.create(address);
      nonce.uid = user.id;

      res.json(201, {address: address, nonce: nonce.id});
    }
  }
});

app.get('/auth', function(req, res) {
  if(req.user) return res.json(200, {auth: true});

  var nonce = db.nonces.find(function(nonce) {return nonce.sid === req.sessionID;});
  if(nonce && nonce.uid) {
    var user = db.users.get(nonce.uid);
    req.session.uid = user.id;
    user.signinCount++;
    db.nonces.delete(nonce.id);
    res.json(200, {auth: true});
  }
  else res.json(200, {auth: false});
});


function ensureAuthenticated(req, res, next) {
  if(req.user) return next();
  else res.redirect('/login');
}

function deserializeUser(req, res, next) {
  req.user = db.users.get(req.session.uid);
  next();
}