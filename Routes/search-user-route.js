const router = require('express').Router();
const dbFunctions = require('../databaseFiles/db_functions');
const TokenVerification = require('../Middlewares/tokenValidation');
const globalSource = require('../Global-source/data');
const jwt = require('jsonwebtoken');
const config = require('../config');



router.post('/findUserQuery',TokenVerification.isTokenExisted,async (req,res) => {
    if(req.body && req.body.query && req.body.queryType){
        let query = req.body.query;
        let queryType = req.body.queryType;
        let userToken = jwt.decode(req.cookies.userData);
        let queryResult = await dbFunctions.searchUsearWithQuery(query,queryType,userToken);
        queryResult.query = query;
        res.json(queryResult);

    }else {
        res.json({emptyRequest:true});
    }
})

router.post('/addSelectedFriend',TokenVerification.isTokenExisted,async(req,res) => {
    if(req.body && req.body.friendName && req.body.friendUserId && req.body.friendProfilePath){
        let socketServer = globalSource.socket;
         let userToken = jwt.decode(req.cookies.userData);
         let result = await dbFunctions.addFriend(userToken.userid,req.body);
         if(result.friendAdded == true){
            let response = {};
            response.friendAdded = true;
             let onlineUserObj = globalSource.onlineUsers.find(user => user.userid == req.body.friendUserId);
             if(onlineUserObj != undefined){
                  socketServer.to(onlineUserObj.sid).emit('add-new-friend',result.userData);
                  response.isFriendOnline = true;
             }else {
                  response.isFriendOnline = false;
             }
             res.json(response);
         }
         

    }
})






module.exports = router;