const express = require ('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const UserModel = require('./models/User');
const MessageModel = require('./models/Message');
const jsonWebToken = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const ws = require('ws');
const { functions } = require('lodash');


//ENV FILE
dotenv.config();

//Database Connection
mongoose.connect(process.env.MONGODB_URL);
const jsonWebTokenSecret = process.env.JSONWEBTOKEN_SECRET;

//Password Encryption
const bcryptSalt = bcrypt.genSaltSync(10);
//
const app = express();
//
app.use(express.json());
//Cookie Parser
app.use(cookieParser());
//Cors
app.use(cors({
credentials: true,
origin: process.env.CLIENT_URL,
}));

//Get online users
app.get('/people', async (req,res) => {
 const users = await UserModel.find({}, {'_id':1,username:1});
 res.json(users);
});

//Send token to API
app.get('/profile', (req,res) => {
const token = req.cookies?.token;
if (token) {
  jsonWebToken.verify(token, jsonWebTokenSecret, {}, (err, userData) => {
    if (err) throw err;
    res.json(userData);
    });
} else {
  res.status(401).json('No Token Sent');
}
});
//Login User
app.post('/login', async (req,res) => {
 const {username, password} = req.body;
 const accountUsername = await UserModel.findOne({username});
 if (accountUsername) {
  const passMatch = bcrypt.compareSync (password, accountUsername.password);
  if (passMatch) {
    jsonWebToken.sign({userId:accountUsername._id, username}, jsonWebTokenSecret, {}, (err, token) => {
      res.cookie('token', token, {sameSite:'none', secure:true}).json({
        id: accountUsername._id,
      });
    });
  }
 }
});

//Logout User
app.post('/logout', (req,res) => {
  res.cookie('token', '', {sameSite:'none', secure:true}).json('Ok');
});

//Register Accounts/Tokens
app.post('/register', async (req,res) => {
  const {username,password} = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await UserModel.create({
      username: username,
      password: hashedPassword,
    });
    jsonWebToken.sign({userId:createdUser._id, username}, jsonWebTokenSecret, {}, (err, token) => {
        if (err) throw err;
        res.cookie('token', token, {sameSite:'none', secure:true}).status(201).json({
          id: createdUser._id,
        });
      });
  } catch(err) {
    if (err) throw err;
    res.status(500).json('error');
  }
});
//Database Test Connection
app.get('/testConnection', (req,res) => {
  res.json('Connection is good');
});
    // res.json()

const server = app.listen(4020);

//Web Socket (User connection)
const wss = new ws.WebSocketServer({server});
wss.on('connection', (connection, req) => {

  //Notify all users about connected users
  function notifyOnlineUsers() {
    [...wss.clients].forEach(client => {
      client.send(JSON.stringify( {
        online: [...wss.clients].map(client => ({userId:client.userId, username:client.username}))
      }));
    });
  }

  connection.isAlive = true;

  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      notifyOnlineUsers();
      console.log('offline');
    }, 1000);
  }, 5000);

  connection.on('pong', () => {
    clearTimeout(connection.deathTimer); 
  });

//Read username and id from the cookie or connection
const cookies = req.headers.cookie;
if (cookies) {
  const tokenCookiesString = cookies.split(';').find(str => str.startsWith('token='));
  if (tokenCookiesString) {
    const token = tokenCookiesString.split('=')[1];
    if (token) {
      jsonWebToken.verify(token, jsonWebTokenSecret, {}, (err, userData) => {
        if (err) throw err;
        const {userId, username} = userData;
        connection.userId = userId;
        connection.username = username;
      });
    }
  }
}
//Sending the messages
  connection.on('message', async (message) => {
    const messageData = JSON.parse(message.toString());
    const {recipient, text} = messageData
    if (recipient && text) {
    const messageDoc =  await MessageModel.create({
        sender: connection.userId,
        recipient,
        text,
      });
      [...wss.clients]
      .filter(c => c.userId === recipient)
      .forEach(c => c.send(JSON.stringify({
        text, 
        sender:connection.userId,
        recipient,
        _id: messageDoc._id,
      })));
    }
  });

  //Get userdata from the request
  async function getUserDataFromRequest(req) {
    return new Promise((resolve, reject) => {
      const token = req.cookies?.token;
      if (token) {
        jsonWebToken.verify(token, jsonWebTokenSecret, {}, (err, userData) => {
        if (err) throw err;
        resolve(userData);
        });
      } else {
        reject('No token');
      }
    });
  }
  //Get messages from the database
  app.get('/messages/:userId', async (req,res) => {
    const {userId} = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    const messages = await MessageModel.find({
      sender:{$in:[userId,ourUserId]},
      recipient:{$in:[userId,ourUserId]},
    }).sort({createdAt: 1});
    res.json(messages);
  });

  //Notify all users about connected users
  notifyOnlineUsers();

});



//MongoDB Credentials
//Username
//mernchat
//Password
//0gEEdX4aSZMcFCNl