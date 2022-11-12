const router = require("express").Router();
const dbFunctions = require("../databaseFiles/db_functions");
const globalSource = require("../Global-source/data");
const utilityFunctions = require("../Utility/sendMail");

router.post("/sendOTPToEmail", async (req, res) => {
  if (req.body && req.body.userid) {
    let userid = req.body.userid;
    let result = await utilityFunctions.sendMail(userid);
    res.json(result);
  } else {
    res.sendStatus(400);
  }
});


router.post('/validateOTP',async (req,res) => {
  if (req.body && req.body.otp) {
    let otp = req.body.otp;
    let userid = req.body.userid;
    let userOtpObj = globalSource.OTPHolder.find(userObj => userObj.userid == userid);
 
    if(userOtpObj){
      if(userOtpObj.otp == otp){
         res.json({isValidOtp:true});
      }else {
         res.json({isValidOtp:false});
      }
    }else {
      res.json({isValidOtp:false});
    }
  }else {
    res.sendStatus(400);
  }
})


router.post('/setNewPassword',async (req,res) => {
  
   if(req.body && req.body.userid && req.body.password){
     let userid = req.body.userid;
     let password = req.body.password;

     let result = await dbFunctions.updateUserPassword(userid,password);
     res.json(result);
   }else {
    res.sendStatus(400);
  }
})

module.exports = router;
