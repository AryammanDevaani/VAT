import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
    getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
    getFirestore, collection, addDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDSDHuA5Vd4MbK4zICi6SnMKa6ZmYa1wAQ",
    authDomain: "vat-a7783.firebaseapp.com",
    projectId: "vat-a7783",
    storageBucket: "vat-a7783.firebasestorage.app",
    messagingSenderId: "383894705786",
    appId: "1:383894705786:web:8cabbbc6a9bb13cae60dc3",
    measurementId: "G-BFVMD58DGM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---- Username → Email ----
const users = {
    "admin": { email: "admin@vacharyatirt.com", role: "admin" },
    "aryamman": { email: "aryamman@vacharyatirt.com", role: "user" },
    "vachan": { email: "vachan@vacharyatirt.com", role: "user" },
    "tirth": { email: "tirth@vacharyatirt.com", role: "user" }
};

// Detect current page
const path = window.location.pathname;

// ---- LOGIN PAGE ----
if (path.endsWith("login.html") || path === "/") {
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const username = e.target.username.value.trim();
            const password = e.target.password.value;

            if (!users[username]) {
                alert("Invalid username");
                return;
            }

            const email = users[username].email;
            signInWithEmailAndPassword(auth, email, password)
                .then(() => {
                    window.location.href = "videos.html";
                })
                .catch(err => alert("Login failed: " + err.message));
        });
    }
}

// ---- VIDEOS PAGE ----
if (path.endsWith("videos.html")) {
    const videoList = document.getElementById("video-list");
    const addForm = document.getElementById("add-form");
    const logoutBtn = document.getElementById("logout-btn");

    let currentRole = null;

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        const username = Object.keys(users).find(
            key => users[key].email === user.email
        );
        currentRole = users[username].role;

        if (currentRole === "admin") {
            addForm.style.display = "block";
        } else {
            addForm.style.display = "none";
        }

        // Load videos
        onSnapshot(collection(db, "videos"), (snapshot) => {
            videoList.innerHTML = "";
            snapshot.forEach((doc) => {
                const data = doc.data();
                const item = document.createElement("a");
                item.className = "item";
                item.href = data.link;
                item.target = "_blank";
                item.innerHTML = `<div>${data.title}</div>`;
                videoList.appendChild(item);
            });
        });
    });

    addForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = e.target.title.value;
        const link = e.target.link.value;
        if (currentRole === "admin") {
            await addDoc(collection(db, "videos"), { title, link });
            e.target.reset();
        }
    });
}
