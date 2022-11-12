const multer = require('multer');
const jwt = require('jsonwebtoken');

let multerStorage = multer.diskStorage({
    destination:(req,file,cb) => {
        console.log('scsc');
        cb(null, __dirname+'/../profile-images')
    },
    filename:(req,file,cb) => {
        let userToken = jwt.decode( req.cookies.userData );
        let extention = file.mimetype.split('/')[1];
        cb(null,`${userToken.userid}.${extention}`)
    }
  })

let upload = multer({
    storage:multerStorage
});


module.exports = upload.fields([{name:'myProfile',maxCount:1}]);