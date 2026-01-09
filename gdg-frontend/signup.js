import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const form = document.getElementById("signupForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const msg = document.getElementById("msg");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  msg.textContent = "Creating account...";

  createUserWithEmailAndPassword(auth, email.value, password.value)
    .then(() => {
      msg.textContent = "Account created ✔ Redirecting...";
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1000);
    })
    .catch((error) => {
      msg.textContent = error.message;
    });
});
