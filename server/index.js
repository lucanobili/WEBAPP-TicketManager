'use strict';

const express = require('express');
const morgan = require('morgan');
const {check, validationResult, oneOf}  = require('express-validator');
const cors = require('cors');
const passport = require('passport'); // auth middleware

const LocalStrategy = require('passport-local'); // username and password for login
const session = require('express-session'); // enable sessions

const dao = require('./dao.js');
const userDao  = require('./dao-user.js');
const dayjs = require('dayjs');
const getCurrentTime = () => dayjs().format('YYYY-MM-DD HH:mm:ss');

const jsonwebtoken = require('jsonwebtoken');
const jwtSecret = 'werfdvkAAbG49hcXf5GIYSvkDICiUAR6EdR5dLdwW7hMzUjjMUe9t6M5kSAYasdX';
const expireTime = 10; //seconds

// init express
const app = express();
app.use(morgan('dev'));

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

const answerDelay = 0; 
//DOM PURIFY
const createDOMPurify = require('dompurify'); 
const{JSDOM} = require('jsdom'); //create a sort of client side

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);


/*** Set up Passport ***/
// set up the "username and password" login strategy
// by setting a function to verify username and password
passport.use(new LocalStrategy(
  function(username, password, done) {
    userDao.getUser(username, password).then((user) => {
      if (!user)
        return done(null, false, { message: 'Incorrect username or password.' });
        
      return done(null, user);
    })
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  userDao.getUserById(id)
    .then(user => {
      done(null, user); // this will be available in req.user
    }).catch(err => {
      done(err, null);
    });
});

// set up the session
app.use(session({
  // by default, Passport uses a MemoryStore to keep track of the sessions
  secret: 'wge8d239bwd93rkskb',   // change this random string, should be a secret value
  resave: false,
  saveUninitialized: false
}));

// then, init passport
app.use(passport.initialize());
app.use(passport.session());

//middleware to check if is logged in or not
const isLoggedIn = (req, res, next) =>{
  if(req.isAuthenticated())
    return next();
  return res.status(401).json({error: 'Not authenticated'});
}


app.get('/api/def', async (req, res) =>{
  try {
    const tickets = await dao.DefView();
    res.json(tickets);
  } catch(err) {
    console.log(err);
    res.status(500).end();
  }
});

app.get('/api/ticket/:id', isLoggedIn,  async (req, res) =>{
  try {
    const tickets = await dao.getBlocks(req.params.id);
    if(tickets.error)
      res.status(404).json(tickets);
    else
      console.log(tickets);
      res.json(tickets);
  } catch(err) {
    console.log(err);
    res.status(500).end();
  }
}
);

app.get('/api/ticket/text/:id', isLoggedIn , check('id').isInt() ,async (req, res) =>{
  try {
    const text = await dao.getText(req.params.id);
    if(text.error)
      res.status(404).json(text);
    else
      res.status(200).json(text);
  } catch(err) {
    console.log(err);
    res.status(500).end();
  }
}
);
//get categories list

app.get('/api/categories', async (req, res) =>{
  try {
    const categ = await dao.getCategories();
    if(categ.error)
      res.status(404).json(categ);
    else
      res.status(200).json(categ);
  } catch(err) {
    console.log(err);
    res.status(500).end();
  }
})

//mofify state
app.put('/api/state/user/:id', isLoggedIn, check('id').isInt(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.array()});
  }
  try {
    const response = await dao.setStateUser(req.user.id, req.params.id);

    if (response.error) {
      res.status(404).json(response); 
    } else {
      res.status(200).json(response); 
    }
  } catch (err) {
    console.error(err);
    res.status(500).end(); 
  }
});

app.put('/api/state/admin/:id', isLoggedIn, [check('id').isInt(), check('value').isBoolean()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.array()});
  }
  try {
    const response = await dao.setStateAdmin(req.user.id, req.params.id, req.body.value);

    if (response.error) {
      res.status(404).json(response); 
    } else {
      res.status(200).json(response); a
    }
  } catch (err) {
    console.error(err);
    res.status(500).end(); 
  }
});

//modifica la cateogira

app.put('/api/category/:id', isLoggedIn, [check('id').isInt(), check('value').isString()], async (req, res) => {
  try {
    const response = await dao.setCategory(req.user.id, req.params.id, req.body.value);

    if (response.error) {
      res.status(404).json(response); 
    } else {
      res.status(200).json(response); 
    }
  } catch (err) {
    console.error(err);
    res.status(500).end(); 
  }
});


const port = 3001;

// add new ticket

app.post('/api/newTickets', isLoggedIn, [
  check('category').isString().notEmpty().withMessage('Category is required'),
  check('title').isString().notEmpty().withMessage('Title is required'),
  check('text').isString().notEmpty().withMessage('Text is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }


  const sanitizedText = DOMPurify.sanitize(req.body.text);
  const sanitizeTitle = DOMPurify.sanitize(req.body.title);

  console.log('stampoo');
  console.log(req.user.id);
  const ticket = {
    state: 1,
    category: req.body.category,
    idOwner: req.user.id,
    title: sanitizeTitle,
    timestamp: getCurrentTime(),
    text: sanitizedText
  };


  try {
    const newTickets = await dao.createTicket(ticket);
    console.log(newTickets)
    res.status(200).json(newTickets);
  } catch (err) {
    console.error('Database error:', err);
    res.status(503).json({ error: `Database error during the creation of the answer: ${err.message}` });
  }
});

//add new Block

app.post('/api/newBlock', isLoggedIn,  [
  check('text').notEmpty().withMessage('Text is required')], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const sanitizedText = DOMPurify.sanitize(req.body.text);

  const block = {
    idticket: req.body.idticket,
    authorId: req.user.id,
    timestamp: getCurrentTime(),
    text: sanitizedText
  };


  try {
    const newBlock = await dao.createBlock(block);
    console.log(newBlock)
    res.status(200).json(newBlock);
  } catch (err) {
    console.error('Database error:', err);
    res.status(503).json(err);
  }
});

/*** Users APIs ***/

// POST /sessions 
// login
app.post('/api/sessions', function(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
      if (!user) {
        // display wrong login messages
        return res.status(401).json(info);
      }
      // success, perform the login
      req.login(user, (err) => {
        if (err)
          return next(err);
        
        // req.user contains the authenticated user, we send all the user info back
        // this is coming from userDao.getUser()
        console.log(user);
        return res.json(req.user);
      });
  })(req, res, next);
});

// ALTERNATIVE: if we are not interested in sending error messages...
/*
app.post('/api/sessions', passport.authenticate('local'), (req,res) => {
  // If this function gets called, authentication was successful.
  // `req.user` contains the authenticated user.
  res.json(req.user);
});
*/

// DELETE /sessions/current 
// logout
app.delete('/api/sessions/current', (req, res) => {
  req.logout( ()=> { res.end(); } );
});

// GET /sessions/current
// check whether the user is logged in or not
app.get('/api/sessions/current', (req, res) => {  if(req.isAuthenticated()) {
    res.status(200).json(req.user);}
  else
    res.status(401).json({error: 'Unauthenticated user!'});;
});


/*** Token ***/

// GET /api/auth-token
app.get('/api/auth-token', isLoggedIn, (req, res) => {
  let authLevel = req.user.admin ? 'admin' : 'normal';

  const payloadToSign = { access: authLevel, authId: 1234 };
  const jwtToken = jsonwebtoken.sign(payloadToSign, jwtSecret, {expiresIn: expireTime});

  res.json({token: jwtToken, authLevel: authLevel});  // authLevel is just for debug. Anyway it is in the JWT payload
});



// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});