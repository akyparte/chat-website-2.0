

(function (params) {
    

    // site loading states
    let socket = io();
    let page_loader = document.getElementById('page-loader');
    let page_loading_progress = document.getElementById('site-loading-progress');
    
    // my profile modal variables-----------------------------------
    let saveChangesEnabled = false;
    let profile_modal = document.getElementById('myprofilemodal');
    let site_loading_bar = document.getElementById('site-loading');
    let my_pro_username = document.getElementById('my-pro-username');
    let my_pro_userid = document.getElementById('my-pro-userid');;
    let my_pro_email = document.getElementById('my-pro-email');;
    let my_pro_password = document.getElementById('my-pro-password');
    let my_pro_image = document.getElementById('profile-image');
    let userProfilePath;
    let my_profile_save_changes_btn = document.getElementById('profile-info-save-changes-btn');
    let my_profile_info_container = document.getElementById('my-pro-info-container');
    let edit_profile_picture_btn = document.getElementById('my-pro-picture-edit-btn');
    let profilePictureUpdateInProcess = false;
    let profileInfoUpdateInProcess = false;

    let profile_warning_toast = document.getElementById('my-toast');
    let my_toast_body = document.getElementById('my-toast-body');
    let my_toast = new bootstrap.Toast(profile_warning_toast);


    let current_profile_username,current_profile_email,current_profile_password,current_profile_userid;


    // add a friend variables ----------------------------------
    let search_userid_username_filter_btn = document.getElementById('search-userid-username-filter');
    let search_friend_input = document.getElementById('search-friend-input');
    let search_friend_btn = document.getElementById('search-friend');
    let search_add_friend_btn = document.getElementById('search-user-modal-add-btn');
    let search_user_close_btn = document.getElementById('search-user-close-btn');
    let search_user_close_cross_btn = document.getElementById('search-user-close-cross-btn');
    let userFoundHolderBox = document.getElementById('search-result-box');
    let friend_list_container = document.getElementById("friend-list-container");

    let search_user_modal = document.getElementById('search-friend-modal');
    let my_search_friend_modal = new bootstrap.Modal(search_user_modal);

    let current_search_user_filter = 'userid';
    let searchingUserStatus = false;
    let isSearchModalActive = false;
    let friendAddingInProcess = false;
    let searchUserResult = [];
    let currentSelectedFriend;
    // let currentQueryId;
    let oldQuery;

    // people list and selected friend with message box variables -------------------------------------------------
    let friend_container = document.getElementById('friend-list-container');
    let selected_friend_username = document.getElementById('selected-fri-username');
    let messages_container = document.getElementById('message-container');
    let send_message_input = document.getElementById('send-message-input');
    let send_message_btn = document.getElementById('send-message-btn');
    let selected_friend_status = document.getElementById('selected-fri-status');

    let chat_header_message_container = document.getElementById('chat-message-header-container');
    let friendsArray = []; // actual friend list
    let isSelectedFriendActive = false;
    let selectedFriendData;
    let messageQueue = [];
    let messageQueueStopId;

   // friends profile variables -----------------------------------------
   let friend_profile_small = document.getElementById('selected-fri-pro-pic');


//  -------------------------- variable declarations and initializations ended here -----------------------

// initializing profile and friendslist
loadUserProfile();
initializeFriendslist();

     friend_container.addEventListener('click',async(e) => {
         let id = getFriendUniqueId(e);
         if(id != undefined){
             let friendDataObj = friendsArray.find(friendObj => friendObj.id == id);
             if(friendDataObj != undefined){
                selected_friend_username.innerText = `${friendDataObj.friendName} [#${friendDataObj.friendsid}]`;
                if(friendDataObj.status == 'online'){
                    selected_friend_status.innerText = 'online';
                }else if(friendDataObj.status == 'New User'){
                    selected_friend_status.innerText = `New User`
                }else {
                    selected_friend_status.innerText = `Last seen: ${timeSince(friendDataObj.status)}`
                }

                messages_container.innerHTML = '';
                if(send_message_input.value.length > 0) send_message_input.value = '';
                isSelectedFriendActive = true;
                selectedFriendData = friendDataObj;

                chat_header_message_container.style.display = 'block';
                let messageLoaderTemplate = `  <div id = 'message-loading-spinner-container' >   
                                <div class="spinner-border" role="status" style="width: 3rem; height: 3rem;">
                                      
                                </div>
                <div/>`;

                messages_container.insertAdjacentHTML('beforeend',messageLoaderTemplate);
                await loadChats(friendDataObj.chatid);
                socket.emit('make-fri-actv',friendDataObj.friendsid);
                // load messages


             } 
         }       
     })

     send_message_input.addEventListener('keypress',(e) => {
         if((e.key.toUpperCase() == 'ENTER') && (isSelectedFriendActive == true)){
            let message = send_message_input.value.trim();
            if(message.length > 0){
                 let messageData = {message:message,time:new Date(),chatid:selectedFriendData.chatid,isFile:0,friendsid:selectedFriendData}
                 sendMessageToFriend(messageData,selectedFriendData);
                 send_message_input.value = '';
            }
         }
     })

     send_message_input.addEventListener('click',() => {

     })

    
     socket.on('received-message',(messageData,friendsid) => {
          if(messageLoadingInProcess == true){
             if(messageQueueStopId == undefined){

                 messageQueueStopId = setInterval(() => {
                }, interval);
             }else {
                messageQueue.push(messageData);
             }
                
          }
     })


    function sendMessageToFriend(messageData,friendData) {
        let tempDate = new Date();
        let time = formatAMPM(tempDate);
        let date = `${tempDate.getDay()}/${tempDate.getMonth()}/${tempDate.getFullYear()}`;
        let messageId = `${friendData.friendName}${tempDate.getSeconds()}${generateUniqueId(1)}`
        let messageTemplate = `<li class="clearfix" id = "${messageId}">
                                       <div class="message-data text-end">
                                           <span class="message-data-time">${time}, ${date}</span>
                                        </div>
                                        <div class="message my-message float-right"> 
                                            <span>
                                               ${messageData.message}
                                            </span>
                                            <i class="bi bi-check2 message-check" style="display:none;"></i>
                                            <i class="bi bi-check2-all message-check" style="display:none;"></i>
                                        </div>    
                               </li>`;

           let dataObj = {
                messageId:messageId,
                message:messageData.message,
                time:messageData.time,
                chatid:messageData.chatid,
                isFile:0,
                friendsid:friendData.friendsid
                }

                messages_container.insertAdjacentHTML('beforeend',messageTemplate);                
           socket.emit('snd-ms',dataObj);                    
    }

    socket.on('mes-rchd-to-svr',(messageId,isFile) => {
       if(isFile == true){
        let messageElement = document.getElementById(messageId);
        messageElement.children[1].children[1].children[1].style.display = 'block';
       }else {
           let messageElement = document.getElementById(messageId);
           messageElement.children[1].children[1].style.display = 'block';
       }

    });

    socket.on('unread-ms-chat-cnt',(friendsId) => {
        increaseUnreadChatCount(friendsId)
    })
    socket.on('svr-sdg-ms-to-frd',(messageData,friendsid) => {
        // first check if this user is talking with his friend
        // if user is talking with this friend actively
        // then add message to

        if( selectedFriendData && selectedFriendData.friendsid == friendsid){
            socket.emit('ms-rcd-to-frd',messageData.messageId,friendsid);
            socket.emit('svr-sdg-ms-to-frd',messageData.messageId,friendsid,selectedFriendData.chatid);
            let tempDate = new Date();
            let time = formatAMPM(tempDate);
            let date = `${tempDate.getDay()}/${tempDate.getMonth()}/${tempDate.getFullYear()}`;
            let friend_message_template = `<li class="clearfix">
                                                <div class="message-data">
                                                    <span class="message-data-time">${time}, ${date}</span>
                                                </div>
                                                <div class="message friend-message">
                                                    <span> ${messageData.message} </span>
                                                </div>                                    
                                            </li> `;
    
            messages_container.insertAdjacentHTML('beforeend',friend_message_template);
        }else {
            socket.emit('frd-not-act-on-cht',friendsid);
            increaseUnreadChatCount(friendsid);
        }
        




    })

    socket.on('ms-seen-by-frd',(messageId) => {
       let messageElement = document.getElementById(messageId);
       messageElement.children[1].children[1].style.display = 'none';
       messageElement.children[1].children[2].style.display = 'block';
    })

    

    


    function increaseUnreadChatCount(friendsid) {
        let elementId = friendsArray.find(friendObj => friendObj.friendsid == friendsid).id;
        for (let i = 0; i < friend_container.children.length; i++) {
            let friendElement = friend_container.children[i];
            if (friendElement.getAttribute('data-id') == elementId) {
                let count = Number(friendElement.children[2].innerText);
                friendElement.children[2].innerText = count + 1;
                if (getComputedStyle(friendElement.children[2]).display == 'none'){
                    friendElement.children[2].style.display = 'flex';
                    break;
                }
            }
        }
    }
    


    async function loadChats(chatid){
           let chats = await createFetchPostRequest('/chatApp/getChats',{request:'initial',chatid:chatid});

           let message_loading_spinner = document.getElementById('message-loading-spinner-container');
           message_loading_spinner.parentNode.removeChild(message_loading_spinner);

           for (let i = 0; i < chats.length; i++) {
               let messageTemplate = ``;
            
           }
    }








  function getFriendUniqueId(e){
    let element = e.target;
    let id;

    if(element.nodeName == 'LI' && Array.from(element.classList).includes('clearfix')){
       id = e.target.getAttribute('data-id');
    }else if(element.nodeName == 'IMG'){
       id = e.target.parentNode.getAttribute('data-id');

    }else if(element.nodeName == 'DIV' && Array.from(element.classList).includes('about')){
       id = e.target.parentNode.getAttribute('data-id');

    }else if(element.nodeName == 'DIV' && Array.from(element.classList).includes('name')){
       id = e.target.parentNode.parentNode.getAttribute('data-id');


    }else if(element.nodeName == 'DIV' && Array.from(element.classList).includes('status')){
       id = e.target.parentNode.parentNode.getAttribute('data-id');

    }else if(element.nodeName == 'DIV' && Array.from(element.classList).includes('badge')){
       id = e.target.parentNode.getAttribute('data-id');
    }  
    return id
}


// show friend profile code ------------------------- starts
friend_profile_small.addEventListener('click',() => {
    full_profile_image.src = ''
})
// show friend profile code ------------------------- ends

// add friend code -------------------------- starts
    search_user_modal.addEventListener('show.bs.modal', () => {
        isSearchModalActive = true;
        userFoundHolderBox.addEventListener('click', addUserToFriendlist);

    })
    search_user_modal.addEventListener('hide.bs.modal', () => {
        isSearchModalActive = false;
        search_friend_input.value = '';
        removeUersFromSearchResultBox();
        oldQuery = '';
        currentSelectedFriend = undefined;
        searchUserResult = [];
    })


    search_user_modal.addEventListener('keypress', async (e) => {
        if (isSearchModalActive) {
            if (e.key.toUpperCase() == 'ENTER') {
                let currentQuery = search_friend_input.value.trim();
                if (currentQuery != oldQuery && currentQuery.length > 0) {
                    oldQuery = currentQuery;

                    let queryObj = { query: currentQuery, queryType: current_search_user_filter };
                    removeUersFromSearchResultBox();
                    //  toggleNoUserdFound('remove');
                    toggleSearchingFriendSpinner('add');
                    let result = await createFetchPostRequest('/searchUser/findUserQuery', queryObj);

                    if (isSearchModalActive == true) {
                        toggleSearchingFriendSpinner('remove');
                        if (result.query == oldQuery && result.userData != null) {
                            result.userData.forEach((userObj, index) => {
                                addUserToSearchList(userObj, index)
                            })
                        } else {
                            toggleNoUserdFound('add');
                        }
                    }

                }
            }
        }

    })

    userFoundHolderBox.addEventListener('click', async (e) => {
        unSelectOtherFriends();
        let selectedUser = selectedUserToAddFriend(e);
        currentSelectedFriend = selectedUser;
    });

    search_add_friend_btn.addEventListener('click', async () => {
        if (friendAddingInProcess == false) {

            let selectedUser = currentSelectedFriend;
            if (selectedUser != undefined) {
                if (currentSelectedFriend.isAlreadyFriend == true) {
                    my_toast_body.innerHTML = `#${currentSelectedFriend.friendUserId} is already a friend`;
                    my_toast.show();
                } else {
                    toggleAddFriendButton(true)

                    let result = await createFetchPostRequest('/searchUser/addSelectedFriend', selectedUser);

                    if (result.friendAdded == true) {
                        if (result.isFriendOnline == true) {
                            selectedUser.status = 'online';
                        }
                        addFriendElementToFriendList(selectedUser);

                        toggleAddFriendButton(false)
                        currentSelectedFriend = undefined;
                        searchUserResult = [];
                        my_search_friend_modal.hide();
                    }
                }
            }
        }
    });

    function toggleAddFriendButton(friendAddingStatus) {
        search_add_friend_btn.children[0].classList.toggle('visually-hidden');
        search_add_friend_btn.children[1].classList.toggle('visually-hidden');
        search_add_friend_btn.children[2].classList.toggle('visually-hidden');
        friendAddingInProcess = friendAddingStatus;
    }

    function unSelectOtherFriends() {
        for (let i = 0; i < userFoundHolderBox.children.length; i++) {
            let userBox = userFoundHolderBox.children[i];
            console.log(userBox)
            if (getComputedStyle(userBox).backgroundColor == 'rgb(237, 237, 237)') {
                userBox.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                break;
            }
        }
    }
    function selectedUserToAddFriend(e) {
        if (e.target.nodeName == 'DIV' && Array.from(e.target.classList).includes('name-id-box')) {
            let userBox = e.target.parentNode;
            userBox.style.backgroundColor = 'rgb(237, 237, 237)';
            return searchUserResult[userBox.index];
        } else if (e.target.nodeName == 'H1' || e.target.nodeName == 'SPAN') {
            let userBox = e.target.parentNode.parentNode;
            userBox.style.backgroundColor = ' rgb(237, 237, 237)';
            return selectedUser = searchUserResult[userBox.index];
        } else if (e.target.nodeName == 'DIV' && Array.from(e.target.classList).includes('search-user-profile')) {
            let userBox = e.target.parentNode;
            userBox.style.backgroundColor = ' rgb(237, 237, 237)';
            return selectedUser = searchUserResult[userBox.index];
        }
    }
    search_userid_username_filter_btn.addEventListener('click', () => {
        if (current_search_user_filter == 'username') {
            search_userid_username_filter_btn.innerText = 'userid';
            current_search_user_filter = 'userid';
            oldQuery = '';
            search_userid_username_filter_btn.blur();
            search_user_modal.focus();
            searchUserResult
        } else if (current_search_user_filter == 'userid') {
            search_userid_username_filter_btn.innerText = 'username';
            current_search_user_filter = 'username';
            oldQuery = '';
            search_userid_username_filter_btn.blur();
            search_user_modal.focus();
        }
    })

    function addUserToSearchList(userObj, index) {
        let obj = {
            friendName: userObj.username,
            friendUserId: userObj.userid,
            friendProfilePath: userObj.profilePath,
            isAlreadyFriend: userObj.isAlreadyFriend,
            status: userObj.status
        }
        searchUserResult.push(obj);
        let userTemplate = ` <div class="search-user-box">
                              <div class="name-id-box">
                                   <h1>${userObj.username}</h1>
                                   <span>#${userObj.userid}</span>
                              </div>
                              <div class="search-user-profile"> </div>
                         </div>`;
        userFoundHolderBox.insertAdjacentHTML('beforeend', userTemplate);
        let userElement = userFoundHolderBox.children[userFoundHolderBox.children.length - 1];
        userElement.querySelector('.search-user-profile').style.backgroundImage = `url(/profile-files/${userObj.profilePath})`;
        userElement.index = index;
    }
    function toggleNoUserdFound(action) {
        if (action == 'add') {
            let searchResultTemplate = ` <div id = 'no-users-found'">
                                     No Users Found !!
                                </div>`;
            userFoundHolderBox.insertAdjacentHTML('beforeend', searchResultTemplate);
        } else if (action == 'remove') {
            let noUsersFound = document.getElementById('no-users-found');
            if (noUsersFound) {
                userFoundHolderBox.removeChild(noUsersFound);
            }
        }
    }

    function removeUersFromSearchResultBox() {
        if (userFoundHolderBox.children.length > 0) {
            userFoundHolderBox.innerHTML = '';
        }
    }

    function toggleSearchingFriendSpinner(action) {
        if (action == 'add') {
            let spinnerTemplate = `<div class="text-center" id = 'search-user-spinner'>
                                    <div class="spinner-border" role="status">
                                    </div>
                               </div>`;
            userFoundHolderBox.insertAdjacentHTML('beforeend', spinnerTemplate);
        } else if (action == 'remove') {
            let searchFriendSpinner = document.getElementById('search-user-spinner');
            if (searchFriendSpinner) {
                userFoundHolderBox.removeChild(searchFriendSpinner);
            }
        }
    }
// add friend code -------------------------- ends


// my profile code -------------------------- starts
my_profile_save_changes_btn.addEventListener('click', async () => {
    if(profilePictureUpdateInProcess != true){
        let fieldsUpdates = updatedProfileFields();
        if(fieldsUpdates.length > 0){
            let formValidationResult = validateFields(fieldsUpdates);
    
            if (formValidationResult.formValidated == true) {
                toggleEditBtn(my_profile_save_changes_btn,true,'edit-profile-info');
                let result = await fetch('/profile/updateProfileInfo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formValidationResult.userData)
                })
    
                result = await result.json();
                if (result.profileUpdated == true) {
                    toggleEditBtn(my_profile_save_changes_btn,false,'edit-profile-info');
                    showToast('profile updated successfully');
                    updateFields(fieldsUpdates);
                } else {
                    showToast('server error occured')
                }
            }
        }else {
             showToast('No updates found');
        }
    }else {
        showToast('profile picture is being updated');
    }

});

edit_profile_picture_btn.addEventListener('click',() => {
    if(profileInfoUpdateInProcess == true){
        my_toast_body.innerText = 'profile info updation in process';
        my_toast.show();
    }else {
        let fileInput = document.createElement('input')
        fileInput.type = 'file';
        fileInput.addEventListener('change',async() => {
            let imageFile = fileInput.files.item(0);
            if(imageFile && imageFile['type'].split('/')[0] === 'image'){
                let size = imageFile.size;
                if((size/1000) <= 20000){
                    let formData = new FormData();
                    formData.append('myProfile',fileInput.files.item(0));
    
                    toggleEditBtn(edit_profile_picture_btn,true,'edit-picture');
                    let result = await fetch('/profile/updateProfilePicture',{
                        method:'POST',
                        body: formData
                    })
    
                    result = await result.json();
                    if(!result.serverError && result.imageUpdated){
                        let picture = fileInput.files.item(0);
                        let fileReader = new FileReader();
                        fileReader.readAsDataURL(picture);
    
                        await new Promise((resolve,reject) => {
                            fileReader.addEventListener('load',() => {
                                my_pro_image.style.backgroundImage = `url(${fileReader.result})`;
                                my_pro_image.updatedToday = true;
                                showToast('Profile updated successfully')
                                resolve();
                            })
                        })
                    }else {
                        showToast('server error occured')
                    }
                    toggleEditBtn(edit_profile_picture_btn,false,'edit-picture');
                }else {
                    showToast('file size should be less than 20 mb');
                }
            }else {
                showToast('Invalid Image Type');
            }
        })
        fileInput.click();
    }
});

profile_modal.addEventListener('show.bs.modal',() => {
    my_pro_username.value = current_profile_username;
    my_pro_email.value = current_profile_email;
    my_pro_password.value = current_profile_password;
})

my_pro_password.addEventListener('focusin',() => {
    my_pro_password.type = 'text';

})

my_pro_password.addEventListener('focusout',() => {
    my_pro_password.type = 'password';

})
async function loadUserProfile() {
    let result = await fetch('/profile/getUserData');
    result = await result.json();

    my_pro_username.value = result.userData.username;
    current_profile_username = result.userData.username;

    my_pro_userid.value = result.userData.userid;
    current_profile_userid = result.userData.userid;
    
    my_pro_email.value = result.userData.email;
    current_profile_email = result.userData.email;

    my_pro_password.value = result.userData.password;
    current_profile_password = result.userData.password;

    userProfilePath = `/profile-files/${result.userData.profilePath}`;
    my_pro_image.style.backgroundImage = `url(${userProfilePath})`;
    my_pro_image.addEventListener('click',loadFullImage)

    pageLoader('50%');

}

function updateFields(fieldsArray) {
    if(fieldsArray.includes('username')){
        current_profile_username = my_pro_username.value.trim();
    }
    if(fieldsArray.includes('email')){
        current_profile_email = my_pro_email.value.trim(); 
    }
    if(fieldsArray.includes('password')){
        current_profile_password = my_pro_password.value.trim();
    }
}

function toggleEditBtn(btn, btnState, btnType) {
    btn.children[0].classList.toggle('visually-hidden');
    btn.children[1].classList.toggle('visually-hidden');
    btn.children[2].classList.toggle('visually-hidden');
    if (btnType == 'edit-picture') profilePictureUpdateInProcess = btnState;
    else if (btnType == 'edit-profile-info') profileInfoUpdateInProcess = btnState;
}
async function loadFullImage() {
    // first close my profile popup
    let full_profile_image_container = document.getElementById('full-pro-img-container');
    let full_profile_image = document.getElementById('full-pro-img');
    let full_profile_close_btn = document.getElementById('full-pro-close-btn');
    let my_profile = bootstrap.Modal.getInstance(profile_modal);

    full_profile_close_btn.addEventListener('click', () => {
        full_profile_image_container.style.display = 'none'
    });
    my_profile.hide();
    full_profile_image_container.style.display = 'flex';
    if (my_pro_image.updatedToday == true) {
        let src = getComputedStyle(my_pro_image).backgroundImage
        full_profile_image.src = src.substring(5, src.length - 2);
    } else {
        full_profile_image.src = userProfilePath;
    }
}
function updatedProfileFields() {
    let result = []
    if (my_pro_username.value.trim() != current_profile_username) {
        result.push('username');
    }
    if (my_pro_email.value.trim() != current_profile_email) {
        result.push('email');
    }
    if (my_pro_password.value.trim() != current_profile_password) {
        result.push('password');
    }

    return result;

}
function isValidPassword(password) {
    let passRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (password.length < 8 || password.length > 25) {
        return {
            result: false,
            message: `passwrd must contain atleast 8 and maximum 25 characters`,
        };
    } else if (!passRegex.test(password)) {
        return {
            result: false,
            message:
                "at least one upperand lower letter,number and special character",
        };
    } else {
        return {
            result: true,
        };
    }
}
function isValidUsername(username) {
    if (username.length > 25) {
        return {
            result: false,
            message: `username can have maximum 25 characters`,
        };
    } else if (username.length == 0) {
        return {
            result: false,
            message: `username can not be empty`,
        };
    } else {
        return { result: true };
    }
}
function validateFields(result) {

    let finalResult = { formValidated: true, userData: {} };
    if (result.includes('username')) {
        let tempUsername = my_pro_username.value.trim();
        let usernameValidation = isValidUsername(tempUsername);
        if (usernameValidation.result) {
            finalResult.userData.username = tempUsername;
        } else {
            showToast(usernameValidation.message)
            finalResult.formValidated = false;
            return finalResult;
        }
    }
    if (result.includes('email')) {
        let tempEmail = my_pro_email.value.trim();

        if (tempEmail.endsWith('gmail.com')) {
            finalResult.userData.email = tempEmail;
        } else {
            showToast('invalid Email')
            finalResult.formValidated = false;
            return finalResult;
        }
    }
    if (result.includes('password')) {
        let tempPassword = my_pro_password.value.trim();
        let passwordValidation = isValidPassword(tempPassword);
        if (passwordValidation.result) {
            finalResult.userData.password = tempPassword;
        } else {
            showToast(passwordValidation.message)

            finalResult.formValidated = false;
            return finalResult;
        }
    }

    return finalResult;
}

// my profile code -------------------------- ends





// initializing friends -------------------------- starts

async function initializeFriendslist() {
    let result = await fetch('/friends/getFriends');
    result = await result.json();

    if (result.hasFriends) {
        for (let i = 0; i < result.friends.length; i++) {
            let userObj = {
                friendName: result.friends[i].friendsname,
                friendProfilePath: result.friends[i].friendprofilepath,
                status: result.friends[i].status,
                id: generateUniqueId(),
                friendsid: result.friends[i].friendsid,
                chatid: result.friends[i].chatid,
                unReadChatCnt:result.friends[i].unReadChatCnt
            }
            addFriendElementToFriendList(userObj);
            friendsArray.push(userObj);
        }
    }
    let id = setInterval(() => {
        if (document.readyState == 'complete') {
            pageLoader("100%");
            clearInterval(id);
        }
    }, 300);

}

async function addFriendElementToFriendList(friendData) {
    let statusClass;
    let lastSeen;
    if (friendData.status == 'online') {
        statusClass = 'online';
        lastSeen = 'online';
    } else if (friendData.status == 'New User') {
        statusClass = 'offline';
        lastSeen = 'New User'
    } else {
        statusClass = 'offline';
        lastSeen = timeSince(friendData.status);
    }
    let unReadChatCnt = '';
    let showOrNot = 'style="display:none"';
    if(friendData.unReadChatCnt != undefined){
         unReadChatCnt = friendData.unReadChatCnt;
         showOrNot = '';
    }
    let friendTemplate = `<li class="clearfix" data-id = "${friendData.id}">
                                <img src="/profile-files/${friendData.friendProfilePath}" class = 'friend-small-profile' alt="avatar">
                                     <div class="about">
                                         <div class="name">${friendData.friendName}</div>
                                         <div class="status"> <i class="fa fa-circle ${statusClass}"></i> ${lastSeen} </div>                                            
                                     </div>
                                     <div class="my-badge" ${showOrNot}> ${unReadChatCnt} </div>
                            </li>` ;

    friend_list_container.insertAdjacentHTML('beforeend', friendTemplate);


}
// initializing friends -------------------------- ends



// common functions ------------------------------- starts
function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

function generateUniqueId(length = 3) {
    let CapitalLetters = ['A','B','C','D','E','F','G','H','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
    let smallLetters = ['a','b','c','d','e','f','g','h','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
    let specialCharacters = ['!','@','#','$','%','^','&','*'];
    let numbers = [1,2,3,4,5,6,7,8,9,0];

    let id = '';
    let randomIndex;
    for(let i = 0;i <= length;i++){
       randomIndex = Math.floor(Math.random() * CapitalLetters.length);
       id = `${id}${CapitalLetters[randomIndex]}`;

       randomIndex = Math.floor(Math.random() * smallLetters.length);
       id = `${id}${smallLetters[randomIndex]}`;

       randomIndex = Math.floor(Math.random() * specialCharacters.length);
       id = `${id}${specialCharacters[randomIndex]}`;

       randomIndex = Math.floor(Math.random() * numbers.length);
       id = `${id}${numbers[randomIndex]}`;
      }
      return id;
}

function timeSince(date) {
    date = new Date(date);
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = seconds / 31536000;

    let finalTime;
    if (interval > 1) {
        finalTime = Math.floor(interval);
        return finalTime === 1 ? `${finalTime} year ago` : `${finalTime} years ago`;
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        finalTime = Math.floor(interval);
        return finalTime === 1 ? `${finalTime} month ago` : `${finalTime} months ago`;
    }
    interval = seconds / 86400;
    if (interval > 1) {
        finalTime = Math.floor(interval);
        return finalTime === 1 ? `${finalTime} day ago` : `${finalTime} days ago`;

    }
    interval = seconds / 3600;
    if (interval > 1) {
        finalTime = Math.floor(interval);
        return finalTime === 1 ? `${finalTime} hour ago` : `${finalTime} hours ago`;
    }
    interval = seconds / 60;
    // console.log(seconds);
    // console.log(interval);


    if (interval > 1) {
        finalTime = Math.floor(interval);
        return finalTime === 1 ? `${finalTime} minute ago` : `${finalTime} minutes ago`;
    }
    // console.log(seconds);
    // if(interval < 1) return `1 second ago`;

    return seconds === 1 ? `${seconds} second ago` : `${seconds} seconds ago`;
}

async function createFetchPostRequest(url, data) {
    let result = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    return await result.json();
}

function showToast(message) {
    my_toast_body.innerText = message;
    my_toast.show();
}

function pageLoader(percent) {
    if (percent == '100%') {
        page_loading_progress.style.width = percent;
        page_loader.style.display = 'none';
    } else {
        page_loading_progress.style.width = percent;
    }
}


// common function ---------------------------------- ends
})();