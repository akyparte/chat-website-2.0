const router = require('express').Router();
const path = require('path');
const dbFunctions = require('../databaseFiles/db_functions');
const jwt = require('jsonwebtoken');
const TokenVerification = require('../Middlewares/tokenValidation');
const config = require('../config');
const utility = require('../Utility/saveChats');

router.get('/',TokenVerification.isTokenExisted,(req,res) => {
    res.sendFile(path.normalize(__dirname+'/../staticPages/chat_app.html'));
})

router.post('/getChats',TokenVerification.isTokenExisted,async(req,res) => {
     if(req.body && req.body.request && req.body.chatid){
        let request = req.body.request;
        let chatid = req.body.chatid;

        let result = await utility.getUserChats(userid,chatid,request);

        res.json(result);
     }


})


module.exports = router;