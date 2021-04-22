/*  =======
    Imports
    =======
*/
// npm packages
const express = require('express');
const cors = require('cors');
// own modules
const jwtModule = require('./imports/important/jwt');
const registerModule = require('./imports/routes/register');
const loginModule = require('./imports/routes/login');
const tokenControlModule = require('./imports/routes/tokenControl');
const homeModule = require('./imports/routes/home');
const userDataModule = require('./imports/routes/userData');
const taskModule = require('./imports/routes/task');
const groupModule = require('./imports/routes/group');

/*  ================
    Configure Server
    ================
*/
// get app
const app = express();
// define Port
const PORT = 1337;
// convert inputdata to json format
app.use(express.json());
app.use(cors());
// start server
app.listen(
    PORT,
    () => console.log('Server lives on http://localhost:' + PORT)
);

/*  ======
    Routes
    ======
*/
// route for register a new user
// using register-module
app.use('/register', registerModule);

// route for login a user
// using login-module
app.use('/login', loginModule);

// route for refresh access token
// using refreshToken module
app.use('/tokenControl', tokenControlModule);

// route to get home Data
// using home module
app.use('/home', homeModule);

// route to get Data of this user
// using userData module
app.use('/user', userDataModule);

// route to manage task(s)
// using task module
app.use('/task', taskModule);

// route to manage group(s)
// using group module
app.use('/group', groupModule);