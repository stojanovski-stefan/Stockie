const loginURL = "final.php";

$(document).ready(function () {});

function checkSession() {
  if (sessionStorage.getItem("session") == null) {
    window.location.href = "../signup.html";
  }
}

function login(username, password) {
  a = $.ajax({
    url: loginURL + "/login",
    type: "GET",
    contentType: "application/json",
    data: {
      username: username,
      password: password,
    },
  })
    .done(function (data) {
      console.log(data);
      if (data.status == 0) {
        sessionStorage.setItem("username", data.username);
        sessionStorage.setItem("session", data.session);
        console.log("User logged in:", data.username);
        console.log("Session ID:", data.session);
        // Add function after page loads
        console.log(data);
        window.location.href = "index.html";
      } else {
        $("#loginErrorMessage").show();
        console.log("Error");
      }
    })
    .fail(function (error) {
      console.log("error", +error.statusText);
    });
}

const logoutURL = "final.php";

function logout(username, session, path) {
  a = $.ajax({
    url: path + "/logout",
    type: "GET",
    contentType: "application/json",
    data: {
      username: username,
      session: session,
    },
  })
    .done(function (data) {
      if (data.status == 0) {
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("session");
        console.log("User logged out");

        window.location.href = "http://localhost/index.html";
      } else {
        $("#logoutErrorMessage").show();
        console.log("Error");
      }
    })
    .fail(function (error) {
      console.log("error", +error.statusText);
    });
}

const signupURL = "final.php";

function signUp(name, username, password) {
  a = $.ajax({
    url: signupURL + "/signUp",
    type: "GET",
    contentType: "application/json",
    data: {
      name: name,
      username: username,
      password: password,
    },
  })
    .done(function (data) {
      if (data.status == 0) {
        console.log(data);
        $("#signup-modal").modal("hide");
        $("#signUpSuccess").show();
        $("#login-modal").modal("show");
      } else {
        $("#signUpErrorMessage").show();
        console.log("Error");
      }
    })
    .fail(function (error) {
      console.log("error", +error.statusText);
      $("#signUpErrorMessage").show();
    });
}
