const nodeMailer = require("nodemailer");
const dbFunctions = require("../databaseFiles/db_functions");
const config = require("../config");
const globalSource = require('../Global-source/data');
const generateNumber = require('generate-unique-id');


class Mailer {
  static async sendMail(userid) {
    let resultStatus = {};
    let user = await dbFunctions.fetchUserInfo(userid);


    const otp = generateNumber({
      length: 6,
      useNumbers: true
    });
    let message = config.OTP_message.replace('[OTP]',otp).replace('[n]',config.otpValidationTime);
    if (user.userData != null) {
      let messageInfo = {
        from: config.email,
        to: user.userData.email,
        subject: config.em_subject,
        text: message,
      };
      let transport = nodeMailer.createTransport({
        service: "gmail",
        auth: {
          user: config.email,
          pass: config.em_password,
        },
        port: 465,
        host: "smtp.gmail.com",
      });

      try {
        await new Promise((resolve, reject) => {
          transport.sendMail(messageInfo, (err) => {
            resultStatus.isRegistredUser = true;
            if (err) {
              resultStatus.OTPsent = false;
              reject("");
            } else {
              let userOTPobj = globalSource.OTPHolder.find(userObj => userObj.userid == userid);

              if(userOTPobj == undefined){ globalSource.OTPHolder.push({userid:userid,otp:otp})
              }else { userOTPobj.otp = otp}

              console.log(userOTPobj)
              resultStatus.OTPsent = true;
              Mailer.removeOtp(userid,config.otpValidationTime);
              resolve("");
            }
          });
        });
      } catch (error) {
        console.log(error);
      }
      return resultStatus;
    } else {
      resultStatus.isRegistredUser = false;
      return resultStatus;
    }
  }

  static generateOTP(){
     return ( Math.floor(Math.random()*100000) );
  }

  static removeOtp(userid,time){
    console.log(time);
    let userOTPobj = globalSource.OTPHolder.find(userObj => userObj.userid == userid);

    setTimeout(() => {
      console.log('clean up');
      if(userOTPobj != undefined){ 
         globalSource.OTPHolder = globalSource.OTPHolder.filter(userObj => userObj.userid != userid);
      }
    },(time * 60)*1000 );
  }
}

module.exports = Mailer;
