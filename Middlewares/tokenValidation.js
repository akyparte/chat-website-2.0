const jwt = require('jsonwebtoken');
const config = require('../config');

class TokenVerification{
    static varifyToken(req,res,next) {
        console.log('f');
        if(req.cookies && req.cookies.userData){
            let token = req.cookies.userData;
            if(!token){
                next()
            }else {
                if(jwt.verify(token,config.JWTKEY)){
                    res.redirect('/chatApp');
                }else {
                    next();
                }
            }
        }else {
            next()
        }
        
    }
    static isTokenExisted(req,res,next){
        console.log('dv');
        if(req.cookies && req.cookies.userData){
            let token = req.cookies.userData;
            if(jwt.verify(token,config.JWTKEY)){
                next();
            }else {
                res.redirect('/');
            }
        }else {
            res.redirect('/');
        }
    }
}


module.exports = TokenVerification;