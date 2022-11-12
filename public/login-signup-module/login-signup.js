(function () {
  // because login module is active by default
  let isLoginContainerActive = true;
  let isSignupContainerActive = false;

  let background_image = document.getElementById('backgroud-image-container')
  // sign up data variables
  const signup_username = document.getElementById("signup-username-input");
  const signup_userID = document.getElementById("signup-userid-input");
  const signup_password = document.getElementById("signup-password-input");
  const signup_confirm_password = document.getElementById(
    "signup-confirm-password-input"
  );
  const signup_email = document.getElementById("signup-email-input");
  // ----------------------
  // login data variables
  const login_userid = document.getElementById("login-userid-input");
  const login_password = document.getElementById("login-password-input");
  // forgot password variables
  const forgot_spinner = document.getElementById("forgot-spinner");
  const forgot_userid = document.getElementById("fgt-userid-input");
  const forgot_password = document.getElementById("fgt-pass-input");
  const forgot_confirm_password = document.getElementById(
    "fgt-confirm-pass-input"
  );
  const forgot_otp_input = document.getElementById("fgt-opt-input");
  const forgot_time = document.getElementById("fgt-time-span");
  const forgot_common_btn = document.getElementById("fgt-cmn-btn");
  const forgot_form_container = document.getElementById('forgot-password-container');
  let forgot_form_state = "sendOTP"; // initial state
  let forgot_userid_holder = '';

  // login form variables
  const forgot_pass_btn_from_login = document.getElementById('forgot-password');
  const login_signup_container = document.getElementById('login-signup-container');
  const toggle_login_page_btn = document.getElementById("login-btn");
  const toggle_singup_page_btn = document.getElementById("signup-btn");
  const login_body = document.getElementById("login-body");
  const signup_body = document.getElementById("signup-body");
  const login_btn = document.getElementById("login-user-btn");
  const signup_btn = document.getElementById("signup-user-btn");
  const login_loading_circle = document.getElementById("login-loading-circle");
  const signup_loading_circle = document.getElementById(
    "signup-loading-circle"
  );
  const my_user_toast = document.getElementById("my-user-toast");
  let toast = new bootstrap.Toast(my_user_toast);
  let toast_body = document.getElementById('cmn-toast');

  toggle_login_page_btn.addEventListener("click", toggleLogin);
  toggle_singup_page_btn.addEventListener("click", toggleSignup);

  login_btn.addEventListener("click", async () => {
    let userid = login_userid.value.trim();
    let password = login_password.value.trim();

    if (userid.length && password.length) {
      let loginData = { userid, password };
      login_loading_circle.classList.toggle("visually-hidden");
      let loginResult = await createPostRequest('/login-signup/makeLoggedIn',loginData);

      if (loginResult.validUser == true) {
        // redirect to home page
        location.href = "/chatApp";
      } else {
        showWarning(login_userid,'Invalid credentials');
      }
       login_loading_circle.classList.toggle("visually-hidden");
    } else {
      for (let i = 0; i < login_body.children.length; i++) {
        if (
          login_body.children[i].tagName == "INPUT" &&
          login_body.children[i].value.trim().length === 0
        ) {
          showWarning(login_body.children[i],"Required field")
          break;
        }
      }
    }
  });

  signup_btn.addEventListener("click", async () => {
    let username = signup_username.value.trim();
    let userid = signup_userID.value.trim();
    let password = signup_password.value.trim();
    let confirm_password = signup_confirm_password.value.trim();
    let email = signup_email.value.trim();
    if ( username.length &&  userid.length && password.length && confirm_password.length && email.length ) {
      if (!email.endsWith("gmail.com")) {
        showWarning(signup_email,'Invalid email');
      } else {
        //validating user input
        let usernameValidationResult = isValidUsername(username);
        let passwordValidationResult = isValidPassword( password, confirm_password);
        let useridValidationResult = isValidUserid(userid);
        if (usernameValidationResult.result != true) {
           showWarning(signup_username,usernameValidationResult.message);
        } else if (passwordValidationResult.result != true) {
          showWarning(signup_confirm_password,passwordValidationResult.message)
        } else if (useridValidationResult.result != true) {
          showWarning(signup_userID,useridValidationResult.message)
        } else {
          let userData = { username, userid, password, email };
          signup_loading_circle.classList.toggle("visually-hidden");
          let UserCreationResult = await createPostRequest('/login-signup/createUser',userData);

          if (UserCreationResult.existingUser) {
            showWarning(signup_userID,'Existing User !!');
          } else {
            toast_body.innerText = 'New user has been created';
            toast.show();
            toggleLogin();
            cleanInput([signup_username,signup_userID,signup_password,signup_confirm_password,signup_email]);
          }
          signup_loading_circle.classList.toggle("visually-hidden");
        }
      }
    } else {
      for (let i = 0; i < signup_body.children.length; i++) {
        if (
          signup_body.children[i].tagName == "INPUT" &&
          signup_body.children[i].value.trim().length === 0
        ) {
          showWarning(signup_body.children[i],'Required field');
          break;
        }
      }
    }
  });

  forgot_common_btn.addEventListener("click", async () => {
    switch (forgot_form_state) {
      case "sendOTP":
        let userid = forgot_userid.value.trim();
        if (userid.length == 0) {
          showWarning(forgot_userid,'Required');
        } else {
          forgotBtnStateChange(true,'Sending OTP')
          let userData = {userid:userid}
          let result = await createPostRequest('/forgot-password/sendOTPToEmail',userData);
          console.log(result);
          if (result.isRegistredUser && result.OTPsent) {
            forgotBtnStateChange(false,'Submit OTP');
            showElement([forgot_otp_input]);
            hideElement([forgot_userid])
            forgot_userid_holder = userid;
            forgot_form_state = 'submitOTP';
            cleanInput([forgot_userid]);
          }else if(result.isRegistredUser && !result.OTPsent){
            // get side popup to show server error
            toast_body.innerText = 'server error occured';
            toast.show();
            forgotBtnStateChange(false,'Send OTP');
          }else if(!result.isRegistredUser){
            showWarning(forgot_userid,'Not registered User');
            forgotBtnStateChange(false,'Send OTP');
          }
           
        }

        break;
      case 'submitOTP':
         let otpFromInput = forgot_otp_input.value.trim();
         forgot_common_btn.disabled = true;
         if(otpFromInput.length != 0){
          let userData = {otp:otpFromInput,userid:forgot_userid_holder};
           
            forgot_spinner.classList.toggle("visually-hidden");
            forgot_common_btn.children[1].innerHTML = "Submitting OTP";
            let result = await createPostRequest('/forgot-password/validateOTP',userData);
            if(result.isValidOtp){
               forgot_form_state = 'setNewPassword';
               hideElement([forgot_otp_input])
               showElement([forgot_password,forgot_confirm_password]);
               cleanInput([forgot_otp_input])
             forgot_common_btn.children[1].innerHTML = "Set New Password";

            }else {
               showWarning(forgot_otp_input,'Invalid OTP');
            }
            forgot_common_btn.disabled = false;
            forgot_spinner.classList.toggle("visually-hidden");


         }

        break;
      case 'setNewPassword':
           let password = forgot_password.value.trim();
           let confirm_password = forgot_confirm_password.value.trim();

           let passwordValidationResult = isValidPassword(password,confirm_password);
           if(passwordValidationResult.result){
               let userData = {password:password,userid:forgot_userid_holder};
               forgot_spinner.classList.toggle("visually-hidden");
               forgot_common_btn.children[1].innerHTML = "Setting new password";
               let result = await createPostRequest('/forgot-password/setNewPassword',userData);
               if(result.passwordUpdated){
                   // clean everything about forgot form
                   // and enable login form
                   hideElement([forgot_password,forgot_confirm_password])
                   cleanInput([forgot_password,forgot_confirm_password]);
                   showElement([forgot_userid]);
                   hideElement([forgot_form_container]);
                   showElement([login_signup_container]);
                   showElement([background_image])
                   forgot_form_state = 'sendOTP';
                   toast_body.innerText = 'Password updated successfully';
                   toast.show();
               }else {

               }
               forgot_spinner.classList.toggle("visually-hidden");
               forgot_common_btn.children[1].innerHTML = "Send OTP";
           }else {
                showWarning(forgot_password,passwordValidationResult.message);
           }
        break;  
    }
  });

  forgot_pass_btn_from_login.addEventListener('click',() => {
      login_signup_container.style.display = 'none';
      forgot_form_container.style.display = 'flex';
      background_image.style.display = 'none';
  })

  // utility functions--------------------
  function isValidPassword(password, confirm_password) {
    let passRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (password != confirm_password) {
      return {
        result: false,
        message: "does not match with password",
      };
    } else if (password.length < 8 || password.length > 25) {
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

  function isValidUserid(userid) {
    let validUseridRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (userid.length < 8 || userid.length > 25) {
      return {
        result: false,
        message: `userid must contain atleast 8 and maximum 25 characters`,
      };
    } else if (!validUseridRegex.test(userid)) {
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
    if (username.length < 1 || username.length > 25) {
      return {
        result: false,
        message: `username can have maximum 25 characters`,
      };
    } else {
      return { result: true };
    }
  }

  function toggleLogin() {
    if (isLoginContainerActive != true) {
      isLoginContainerActive = true;
      isSignupContainerActive = false;
      toggle_singup_page_btn.classList.toggle("pressed-color");
      toggle_singup_page_btn.classList.toggle("unpressed-color");
      toggle_login_page_btn.classList.toggle("pressed-color");
      toggle_login_page_btn.classList.toggle("unpressed-color");
      login_body.style.display = "flex";
      signup_body.style.display = "none";
      cleanInput([login_userid,login_password])
    }
  }

  function toggleSignup() {
    if (isSignupContainerActive != true) {
      isLoginContainerActive = false;
      isSignupContainerActive = true;
      toggle_singup_page_btn.classList.toggle("pressed-color");
      toggle_singup_page_btn.classList.toggle("unpressed-color");
      toggle_login_page_btn.classList.toggle("pressed-color");
      toggle_login_page_btn.classList.toggle("unpressed-color");
      signup_body.style.display = "flex";
      login_body.style.display = "none";
      cleanInput([signup_username,signup_userID,signup_password,signup_confirm_password,signup_email]);
    }
  }


  function cleanInput(elements) {
    elements.forEach((element) => element.value = '');
  }

  function showElement(elements) {
    console.log(elements)
    elements.forEach(element => element.style.display = 'block');
  }

  function hideElement(elements) {
    elements.forEach(element => element.style.display = 'none');
  }

  function showWarning(element,message) {
     element.setCustomValidity(message);
     element.reportValidity();
  }

  async function createPostRequest(url,body) {
    let result = await fetch(url,{
      method:"POST",
      headers:{
         'Content-Type':'application/json'
      },
      body:JSON.stringify(body)
   })
     return (await result.json());
  }

  function forgotBtnStateChange(disableState,btnText) {
    forgot_spinner.classList.toggle("visually-hidden");
    forgot_common_btn.children[1].innerHTML = btnText;
    forgot_common_btn.disabled = disableState;
  }
})();
