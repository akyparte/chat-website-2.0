const globalSource = require('../Global-source/data')
const db_functions = require('../databaseFiles/db_functions');
const { Users,Friends,UserTimeStamp,Chats } = require("../databaseFiles/database");



async function manageChats(data) {
     let chatArray = globalSource.chatArray[data.chatid];

     if (chatArray == undefined) {
          let tempArrHolder = [];
          globalSource.chatArray[data.chatid] = tempArrHolder;
          chatArray = tempArrHolder;
     }

     chatArray.push({ message: data.message, time: data.time, user: data.user,isFile:data.isFile,mid:data.messageId });
     if (chatArray.length >= 10) {
          let tempChats = chatArray.slice();
          chatArray.length = 0;
          let result = await db_functions.saveChats(chatid, tempChats);
     }
}


async function getUserChats(userid,friendsid,chatid,request) {
     let unreadChatCnt = 0;
     let unreadChatCountObj = globalSource.unreadChatCountArray;

     if(unreadChatCountObj && unreadChatCountObj[userid]){
         if(unreadChatCountObj[userid][friendsid]){
          unreadChatCnt = unreadChatCountObj[userid][friendsid];
         }
     }

     let chatArray = globalSource.chatArray[chatid];
     if(chatArray == undefined) chatArray = [];

     if(request == 'initial'){
          if(unreadChatCnt > 8){
             if(unreadChatCnt == chatArray.length){
               return chatArray.splice();
             }else {
                let remainingChatIndex = unreadChatCnt - chatArray.length;
                let totalChatCount = Chats.count({where:{chatid:chatid}});
                let result = await Chats.findAll({
                    limit:remainingChatIndex,
                    offset:totalChatCount-remainingChatIndex,
                     where:{
                       chatId:chatid
                     },
                });

                result = result.map(chatObj => chatObj.dataValues)
                return [...chatArray.splice(),...result];
             }  
          }else if(unreadChatCnt < 8){
               
          }
          if(chatArray.length > 8){
               return chatArray.splice()
          }else if(chatArray.length <= 8 && chatArray.length != 0){
              return chatArray;
          }else {
               let result = await Chats.findAll({
                   limit:8,
                    where:{
                      chatId:chatid
                    },
               });
     
               if(result.length){
                    return result.map(chatObj => chatObj.dataValues);
               }else {
                    return [];
               }
          }
     }else if(request == 'advanced'){

     }


}

function manageUnreadChats(userid,friendId) {
     let friendChatCnt =  globalSource.unreadChatCountArray[userid];

     if(friendChatCnt) {
         if(friendChatCnt[friendId]){
            friendChatCnt[friendId] = friendChatCnt[friendId] + 1;
         }else {
            friendChatCnt[friendId] = 1;
         }
     }else {
          globalSource.unreadChatCountArray[userid] = {
            [friendId] : 1
          }
     } 
}


module.exports.manageChats = manageChats;
module.exports.getUserChats = getUserChats;
module.exports.manageUnreadChats = manageUnreadChats;