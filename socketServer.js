let globalSource = require('./Global-source/data');
const db_functions = require('./databaseFiles/db_functions');
const cookie = require('cookie');
let jwt = require('jsonwebtoken');
const utility = require('./Utility/saveChats');

let socketServer = globalSource.socket;

socketServer.on('connection',async (socket) => {

   if(socket.handshake.headers.cookie != undefined){
      let userCookie = cookie.parse(socket.handshake.headers.cookie);
      let userToken = jwt.decode(userCookie.userData)
      let onlineUserObj = globalSource.onlineUsers.find(user => user.userid == userToken.userid);

      let friends = await db_functions.getFriendsStatus(userToken.userid);
      globalSource.onlineUsers.push({userid:userToken.userid , sid:socket.id,friends:friends});


      socket.on('disconnect',async() => {
         if(socket.handshake.headers.cookie){
            let userCookie = cookie.parse(socket.handshake.headers.cookie);
            let userToken = jwt.decode(userCookie.userData);
            let onlineUserIndex = globalSource.onlineUsers.findIndex(user => user.userid == userToken.userid);

            if(onlineUserIndex != -1){
                  globalSource.onlineUsers[onlineUserIndex] = globalSource.onlineUsers[globalSource.onlineUsers.length-1];
                  globalSource.onlineUsers.pop();
            }
            await db_functions.saveUsersLastSeen(userToken.userid,socket.handshake.time);
         }
      })

      socket.on('snd-ms',async (messageData) => {
         if(socket.handshake.headers.cookie){
            let userCookie = cookie.parse(socket.handshake.headers.cookie);
            let userToken = jwt.decode(userCookie.userData);
            messageData.user = userToken.username;
            await utility.manageChats(messageData);
            let friend = globalSource.onlineUsers.find(user => user.userid == messageData.friendsid);
            let user = globalSource.onlineUsers.find(user => user.userid == userToken.userid);


            socket.emit('mes-rchd-to-svr',messageData.messageId);
            if(friend){
                  socketServer.to(friend.sid).emit('svr-sdg-ms-to-frd',messageData,userToken.userid);   
            }else {
               
               utility.manageUnreadChats(messageData.friendsid,userToken.userid);
            }
         
         }
      });

      socket.on('svr-sdg-ms-to-frd', async(messageid, friendsid, chatid) => {
         if (socket.handshake.headers.cookie) {
            let chatArr = globalSource.chatArray[chatid];
            if (chatArr.length == 0) {
               // update it in db
               await db_functions.updateMessageStatus(chatid,messageid);
            } else {
               for (const messageObj of chatArr) {
                  if (messageObj.mid == messageid) {
                     messageObj.messageSeen = 1;
                     break;
                  }
               }
            }
            let friend = globalSource.onlineUsers.find(user => user.userid == friendsid);
            if (friend) {
               socketServer.to(friend.sid).emit('ms-seen-by-frd', messageId);
            }
         }
      })
      socket.on('frd-not-act-on-cht', (friendsid) => {
         if (socket.handshake.headers.cookie) {
            let userCookie = cookie.parse(socket.handshake.headers.cookie);
            let userToken = jwt.decode(userCookie.userData);

            let friend = globalSource.onlineUsers.find(userObj => userObj.userid == friendsid);
            if (friend) {
               // socketServer.to(friend.sid).emit('unread-ms-chat-cnt', userToken.userid);
               utility.manageUnreadChats(friendsid, userToken.userid);
            }
         }
      })
      socket.on('ms-rcd-to-frd',(messageId,friendsid) => {
         if(socket.handshake.headers.cookie){
            let userCookie = cookie.parse(socket.handshake.headers.cookie);
            let userToken = jwt.decode(userCookie.userData);

            let friend = globalSource.onlineUsers.find(user => user.userid == friendsid);

            if(friend){
               let friendsList = friend.friends;

               // make mssage seen
               if(friendsList[userToken.userid] == 1){
                  socketServer.to(friend.sid).emit('ms-seen-by-frd',messageId);
               } 
            }





         } 
      })
      socket.on('svr-sdg-cnfrm-to-usr',(messageId,friendsid) => {
         if(socket.handshake.headers.cookie){
            let userCookie = cookie.parse(socket.handshake.headers.cookie);
            let userToken = jwt.decode(userCookie.userData);

            let friend = globalSource.onlineUsers.find(user => user.userid == friendsid);
            let user = globalSource.onlineUsers.find(user => user.userid == userToken.userid);



         }
      })

      socket.on('make-fri-actv',(friendId) => {
         if(socket.handshake.headers.cookie){
            let userCookie = cookie.parse(socket.handshake.headers.cookie);
            let userToken = jwt.decode(userCookie.userData);
            let onlineUser = globalSource.onlineUsers.find(user => user.userid == userToken.userid);
            if(onlineUser){
               let friendsList = onlineUser.friends;
               friendsList[friendId] = 1;
            }

         }   
      })
   }

})

socketServer.on('error',(err) => {
    console.log(err)
 });