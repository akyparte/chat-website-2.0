const http = require("http");
const express = require("express");
const app = express();
const server = http.createServer(app);
const loginSignupRoute = require("./Routes/Login-logout-route");
const forgotPasswordRoute = require("./Routes/Forgot-password-route");
const profileRoute = require('./Routes/profile-route');
const searchUserRoute = require('./Routes/search-user-route')
const TokenVerification = require('./Middlewares/tokenValidation');
const chatAppRoute = require('./Routes/chatApp-route');
const friendsRoute = require('./Routes/friends-route');
const cookieParser = require("cookie-parser");
const { allowedNodeEnvironmentFlags } = require("process");
const { Server } = require("socket.io");
const io = new Server(server);
const globalSource = require('./Global-source/data');
globalSource.socket = io;

require('./socketServer');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(express.static('images'));
app.use("/login-signup-files",express.static(__dirname + "/public/login-signup-module"));
app.use("/chat-app-files",express.static(__dirname + "/public/chat-app-module"));
app.use("/profile-files",express.static(__dirname + "/profile-images",{extensions:['jpg','jpeg','png']}));


app.get("/",TokenVerification.varifyToken ,function (req, res) {
  res.sendFile(__dirname + "/staticPages/login-signup.html");
});

// app.get('/socket.io/socket.io.js',TokenVerification.isTokenExisted, (req, res) => {
//   res.sendFile(__dirname + '/node_modules/socket.io/client-dist/socket.io.js');
// });

app.use('/chatApp',chatAppRoute)
app.use('/profile',profileRoute)
app.use("/login-signup", loginSignupRoute);
app.use("/forgot-password", forgotPasswordRoute);
app.use('/searchUser',searchUserRoute)
app.use('/friends',friendsRoute)

server.listen(8000, "192.168.0.108");
