'use strict';

const express = require('express');
const morgan = require('morgan'); // logging middleware
const cors = require('cors');

const { expressjwt: jwt } = require('express-jwt');

const jwtSecret = 'werfdvkAAbG49hcXf5GIYSvkDICiUAR6EdR5dLdwW7hMzUjjMUe9t6M5kSAYasdX';


// init express
const app = new express();
const port = 3002;

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};

app.use(cors(corsOptions));

// set-up the middlewares
app.use(morgan('dev'));
app.use(express.json()); // To automatically decode incoming json

// Check token validity
app.use(jwt({
  secret: jwtSecret,
  algorithms: ["HS256"],
  // token from HTTP Authorization: header
})
);

// set-up the middlewares
app.use(morgan('dev'));
app.use(express.json()); // To automatically decode incoming json

// Check token validity
app.use(jwt({
  secret: jwtSecret,
  algorithms: ["HS256"],
  // token from HTTP Authorization: header
})
);

/*** APIs ***/

// POST /api/estimation
app.post('/api/estimation', (req, res) => {
  console.log('DEBUG: req.auth: ',req.auth);
  
  try {
    const authAccessLevel = req.auth.access;
    const nTot = req.body.title.replace(/ /g, '').length + req.body.category.replace(/ /g, '').length;
    const value = nTot * 10 + Math.floor(Math.random() * 239) + 1;
    let est = 0

    if (authAccessLevel === 'admin') {
      est = value + ' hours';
    } else if (authAccessLevel === 'normal') {
      est = Math.floor(value/24) + ' days';
    }
  
    res.status(200).json({estimation: est });
  } catch (err) {
    console.error('Database error:', err);
    res.status(503).json({ error: `Database error during the creation of the answer: ${err.message}` });
  }

});


/*** Other express-related instructions ***/



// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
