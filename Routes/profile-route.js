const router = require('express').Router();
const path = require('path');
const dbFunctions = require('../databaseFiles/db_functions');
const jwt = require('jsonwebtoken');
const TokenVerification = require('../Middlewares/tokenValidation');
const uploadByMulter = require('../Utility/saveProfileImages');
const config = require('../config');

router.get('/getUserData',TokenVerification.isTokenExisted,async (req,res) => {
    if(req.cookies && req.cookies.userData){
         let userToken = jwt.decode(req.cookies.userData);
         let result = await dbFunctions.fetchUserInfo(userToken.userid);
         if(result.userData != undefined){
            res.json(result);
         }else {
            // handle if user not found at this stage 
            // someone is playing with site
         }

         
    }
})

router.post('/updateProfilePicture',[TokenVerification.isTokenExisted,uploadByMulter],async(req,res) => {
   if(req.files && req.files.myProfile){
      let userToken = jwt.decode(req.cookies.userData);
      let resullt = await dbFunctions.updateUserProfilePath(userToken.userid,userToken.userid);
      if(resullt.profilePathUpdated){
         res.json({imageUpdated:true});
      }else {
         res.json({serverError:true})
      }
   }else {
      res.json({serverError:true});
   }
});

router.post('/updateProfileInfo',TokenVerification.isTokenExisted,async(req,res) => {
     if(req.body && Object.keys(req.body).length > 0){  
      let userToken = jwt.decode(req.cookies.userData);  
         let result = await dbFunctions.updateProfileInfo(userToken.userid,req.body);
         if(result.profileUpdated){
            res.json(result);
         }else {
            res.json({serverError:true});
         }
     }else {
         res.json({infoMissing:true})
     }
})




module.exports = router;