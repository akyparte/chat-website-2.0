const router = require('express').Router();
const dbFunctions = require('../databaseFiles/db_functions');
const globalSource = require('../Global-source/data');
const jwt = require('jsonwebtoken');
const config = require('../config');

router.post('/makeLoggedIn',async(req,res) => {
     if(req.body){
          let password = req.body.password;
          let userid = req.body.userid;
          if(userid && password){
              let validationResult = await dbFunctions.isValidUser(userid,password);
              if(validationResult.validUser == true){
               try {
                    var token = jwt.sign({ 
                         userid,
                         username:validationResult.user.username
                     }, config.JWTKEY);

                    res.cookie('userData',token, { maxAge: 900000});
               }catch(err){
                    console.log(err)
               }
              }
              res.json(validationResult);
          }else {
               res.sendStatus(400);
          }
     }
})

router.get('/logout',(req,res) => {
    res.clearCookie();
    res.redirect('/');
})

router.post('/createUser',async (req,res) => {
     if(req.body){
          let username = req.body.username;
          let password = req.body.password;
          let userid = req.body.userid;
          let email = req.body.email;
          if(username && userid && email && password){
               let createUserResult = await dbFunctions.createUser(username, password, email, userid);
               res.json(createUserResult)
          }else {
               res.sendStatus(400);
          }
     }
     
})

router.post('/isAlreadyUser',async(req,res) => {
    if(req.body && req.body.userid){
       let result = await dbFunctions.isAlreadyUser(req.body.userid);
       if(result.existingUser){
          res.json(result);
       }else {
          res.json(result);
       }
    }else {
     res.sendStatus(400);
    }
})

module.exports = router;