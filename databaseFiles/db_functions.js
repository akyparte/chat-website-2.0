const bcrypt = require("bcrypt");
const { Users,Friends,UserTimeStamp,Chats } = require("./database");
const generateUniqueId = require('generate-unique-id');
const globalSource = require('../Global-source/data');
class Queries {
  static async createUser(username, password, email, userid) {
    let salt = await bcrypt.genSalt(10);
    let hashedPassword = await bcrypt.hash(password, salt);
    const [user, created] = await Users.findOrCreate({
      where: { userid: userid },
      defaults: { username, password: hashedPassword, email },
    });
    if (created) {
      return { existingUser: false };
    } else {
      return { existingUser: true };
    }
  }

  static async updateMessageStatus(messageid,chatid){
      await Chats.update({messageSeen:1},{where:{
        mid:messageid,
        chatid:chatid
      }});
  }

  static async saveChats(chatid,chats){
      let chatsArray = [];

      for (let i = 0; i < chats.length; i++) {
          chatsArray.push({
               chatid : chats[i].chatid,
               user : chats[i].user,
               message : chats[i].message,
               timeStamp : chats[i].time
          });
      }

      let result = await Chats.bulkCreate(chatsArray)
      if(result.length > 0){
        return {chatsAdded:true}
      }else {
        return {chatsAdded:false}
      }


  }


  static async getFriendsStatus(userid){
      let friends = await Friends.findAll({where:{
        usersid:userid
      }})

      if(friends.length > 0){
         let friendsStatus = {};

         for (let i = 0; i < friends.length; i++) {
              friendsStatus[friends[i].dataValues.friendsid] = 0;
         }

         return friendsStatus;
      }
  }

  static async isAlreadyUser(userid) {
    let user = await Users.findOne({
      where: { userid: userid },
    });
    if (user) {
      return { existingUser: true };
    } else {
      return { existingUser: false };
    }
  }

  static async isValidUser(userid, password) {
    let user = await Users.findOne({
      where: { userid, password },
    });

    if (user) {
      return { validUser: true,user:user.dataValues };
    } else {
      return { validUser: false,user };
    }
  }

  static async fetchUserInfo(userid) {
    let user = await Users.findOne({
      where: { userid: userid },
    });

    if (user) {
      return { userData: user.dataValues };
    } else {
      return { userData: null };
    }
  }

  static async updateUserPassword(userid, password){
    let salt = await bcrypt.genSalt(10);
    let hashedPassword = await bcrypt.hash(password, salt);
       let updatePasswordResult = await Users.update(
        { password:hashedPassword },
        { where:{ userid:userid } }
       );

       if(updatePasswordResult[0]){
          return {passwordUpdated:true}
       }else {
          return {passwordUpdated:false}
       }
  }

  static async updateUserProfilePath(userid, profilePath) {
    try {
      await Users.update(
        { profilePath: profilePath },
        { where: { userid: userid } }
      );
      return { profilePathUpdated: true }

    } catch (error) {
      return { profilePathUpdated: false }
    }
  }

  static async updateProfileInfo(userid,userData){
        let dataToBeUpdated = {};
           if(userData.username){
              dataToBeUpdated.username = userData.username;
           }
           if(userData.email){
             dataToBeUpdated.email = userData.email;
           }
           if(userData.password){
            let salt = await bcrypt.genSalt(10);
            let hashedPassword = await bcrypt.hash(userData.password, salt);
             dataToBeUpdated.password = hashedPassword;
           }

           let result = await Users.update(dataToBeUpdated,{where:{userid:userid}});

           if(result[0]){
            return {profileUpdated:true}
           }else {
            return {profileUpdated:false}
           }
  }

  static async searchUsearWithQuery(query,queryType,userObj){
      if(queryType == 'userid'){

          if(query == userObj.userid){
              return { userData: null };
          }else {
            let isAlreadyFriend = false;
            let usersFriend = await Friends.findOne({where:{usersid:userObj.userid,friendsid:query}});

            if(usersFriend){
                isAlreadyFriend = true;
            }

              let friend = await Users.findOne({
                where: {
                  userid: query
                }
              });

              if (friend != undefined) {
                 let usersLastSeen = await UserTimeStamp.findOne({where:{userid:friend.dataValues.userid}});
                 if(usersLastSeen != undefined){
                    friend.dataValues.status = usersLastSeen.status;      
                 }else {
                    friend.dataValues.status = 'New User';
                 }
                 friend.dataValues.isAlreadyFriend = isAlreadyFriend;
                 return { userData: [friend.dataValues] };

              } else {
                return { userData: null };
              }


          }


      }else if(queryType == 'username'){
        let people = await Users.findAll({where:{
          username:query
        }});

        let usersFriends = await Friends.findAll({where:{usersid:userObj.userid}});

        let tempFriends = [];
        for(let i = 0;i < usersFriends.length;i++){
          tempFriends.push(usersFriends[i].dataValues)
        }
        usersFriends = tempFriends;

        if(people.length > 0){
          let userData = [];
          for(let i = 0;i < people.length;i++){
            if(people[i].dataValues.userid != userObj.userid){
               let result = usersFriends.find(obj => obj.friendsid == people[i].dataValues.userid);
               if(result != undefined){
                 people[i].dataValues.isAlreadyFriend = true;
               }else {
                people[i].dataValues.isAlreadyFriend = false;
               }

                let usersLastSeen = await UserTimeStamp.findOne({where:{userid:people[i].dataValues.userid}});
                if(usersLastSeen != undefined){
                   people[i].dataValues.status = usersLastSeen.status;
                }else {
                   people[i].dataValues.status = 'New User';
                }
                userData.push(people[i].dataValues)
             } 
          }
          if(userData.length > 0)  return {userData};
          else return {userData:null}
 
        }else {
          return {userData:null}
        }
      }
  }

  static async addFriend(usersUserId,friendData){
    const id = generateUniqueId({
      length: 32,
      useLetters: true,
      useNumbers:true,
      includeSymbols:['@','#','&','*']
    });
       let usersData = await Users.findOne({
        where:{userid:usersUserId}
       })
       
       let createUserResult = await Friends.bulkCreate([
         {
          usersid:usersData.dataValues.username,
          friendsid:friendData.friendUserId,
          friendprofilepath:friendData.friendProfilePath,
          friendsname:friendData.friendName,
          chatid:id
         },
         {
          usersid: friendData.friendUserId,
          friendsid: usersData.dataValues.userid,
          friendprofilepath: usersData.dataValues.profilePath,
          friendsname:usersData.dataValues.username,
          chatid:id
         },
       ]);

       if(createUserResult.length > 0){
          return {friendAdded:true,userData:usersData}
       }else {
          return {friendAdded:false}
       }
  }


  static async getFriends(userid){
      let friends = await Friends.findAll({where:{usersid:userid}});
      let userUnReadChatObj = globalSource.unreadChatCountArray[userid];


      if(friends.length > 0){
        // let filteredFriends = friends.map(friendObj => friendObj.dataValues);
        let filteredFriends = [];
        for(let i = 0;i < friends.length;i++){
           let onlineUser = globalSource.onlineUsers.find(user => user.userid == friends[i].dataValues.friendsid);
           let usersLastSeen = await Queries.getUsersLastSeen(friends[i].dataValues.friendsid);

           if(userUnReadChatObj && userUnReadChatObj[friends[i].dataValues.friendsid]){
              friends[i].dataValues.unReadChatCnt = userUnReadChatObj[friends[i].dataValues.friendsid];
           }
           if(onlineUser){
             friends[i].dataValues.status = 'online';
           }else if(usersLastSeen.status != undefined){
             friends[i].dataValues.status = usersLastSeen.status;
           }else {
             friends[i].dataValues.status = 'New User';
           }

           filteredFriends.push(friends[i].dataValues);
        } 
        return {
            hasFriends:true,
            friends:filteredFriends
          }
      }else {
        return {
          hasFriends:false,
        }
      }
  }

  static async saveUsersLastSeen(userid,lastSeen){
      let user = await UserTimeStamp.findOne({where:{userid:userid}});

      if(user != undefined){
        let updatedResult = await UserTimeStamp.update({status:lastSeen},{where:{userid}});
        if(updatedResult[0]){
          return {statusUpdated:true}
        }else {
          return {statusUpdated:false}
        }
      }else {
        let result = await UserTimeStamp.create({userid:userid,status:lastSeen});
      }
  }

  static async getUsersLastSeen(userid){
    let user = await UserTimeStamp.findOne({where:{userid:userid}});

    if(user != undefined){
      return {status:user.dataValues.status}
    }else {
      return {status:undefined}
    }
  }
}
module.exports = Queries;
