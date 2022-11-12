const router = require('express').Router();
const dbFunctions = require('../databaseFiles/db_functions');
const TokenVerification = require('../Middlewares/tokenValidation');
const globalSource = require('../Global-source/data');
const jwt = require('jsonwebtoken');
const config = require('../config');


router.get('/getFriends',TokenVerification.isTokenExisted,async(req,res) => {
    let userToken = jwt.decode(req.cookies.userData);

    let result = await dbFunctions.getFriends(userToken.userid);
    res.json(result);
})


module.exports = router;
