import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const form = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const msg = document.getElementById("msg");

form.addEventListener("submit", (event) => {
  event.preventDefault(); // 🚨 THIS LINE FIXES EVERYTHING

  msg.textContent = "Logging in...";

  signInWithEmailAndPassword(auth, email.value, password.value)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(error => {
      msg.textContent = error.message;
    });
});
