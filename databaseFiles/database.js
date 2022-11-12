const config = require('../config');
const { Sequelize , DataTypes } = require('sequelize');
const sequelize = new Sequelize(config.database,config.username,config.password,{
    host:config.host,
    dialect:config.dialect,
});
(async function() {
    try{
       await sequelize.authenticate();
       console.log('connection has been established');
    }catch{
       console.log('error occured');
    }
})();



let Users = sequelize.define('Users',{
    username:{
        type:DataTypes.STRING(30),
        allowNull:false,
    },
    userid:{
        type:DataTypes.STRING(25),
        allowNull:false,
    },
    email:{
        type:DataTypes.STRING(40),
        allowNull:false,
    },
    password:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    profilePath:{
        type:DataTypes.STRING,
        allowNull:true,
        defaultValue:'defaultProfile'
    }
},{
    indexes:[
        {
            unique: true,
            fields: ['userid']
          }
    ],
    timestamps:false

});
Users.removeAttribute('id');

let Friends = sequelize.define('Friends',{
    usersid:{
        type:DataTypes.STRING(30),
        allowNull:false,
    },
    friendsid:{
        type:DataTypes.STRING(30),
        allowNull:false,
    },
    chatid:{
        type:DataTypes.STRING(40),
        allowNull:false, 
    },
    friendprofilepath:{
        type:DataTypes.STRING(30),
        allowNull:false, 
    },
    friendsname:{
        type:DataTypes.STRING(30),
        allowNull:false, 
    }
},{timestamps:false})
Friends.removeAttribute('id');


let UserTimeStamp = sequelize.define('userstatus',{
    userid:{
        type:DataTypes.STRING(30),
        allowNull:false
    },
    status:{
        type:DataTypes.STRING(70),
        allowNull:false
    }
},
{indexes:[
    {
        fields: ['userid']
    }
],
timestamps:false,
});

UserTimeStamp.removeAttribute('id');

let Chats = sequelize.define('chats',{
    chatId:{
        type:DataTypes.STRING(40),
        allowNull:false
    },
    user:{
        type:DataTypes.STRING(30),
        allowNull:false
    },
    message:{
        type:DataTypes.STRING(600),
        allowNull:false
    },
    timeStamp:{ 
        type:DataTypes.STRING(70),
        allowNull:false
    },
    messageSeen:{ 
        type:DataTypes.TINYINT,
        allowNull:false,
        defaultValue:0
    },
    isFile:{ 
        type:DataTypes.TINYINT,
        allowNull:false,
        defaultValue:0
    },
    mid:{ 
        type:DataTypes.STRING(40),
        allowNull:false,
    },


},{
    indexes:[
        {
            fields: ['chatId']
          }
    ],
    timestamps:false,
});

Chats.removeAttribute('id');

(async function () {
    try{
       await sequelize.sync();
       console.log('table created');
    }catch(err){
        console.log(err);
        console.log('error occured');
    }
})();

module.exports.Users = Users;
module.exports.Friends = Friends;
module.exports.UserTimeStamp = UserTimeStamp;
module.exports.Chats = Chats;
module.exports.Sequelize = Sequelize;

