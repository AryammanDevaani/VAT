// -------------------------
// Firebase Initialization
// -------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCGecLDtzjqcnNnedy6EVpsKJ2SZ6sNZEc",
  authDomain: "vachanaryammantirth.firebaseapp.com",
  projectId: "vachanaryammantirth",
  storageBucket: "vachanaryammantirth.appspot.com",
  messagingSenderId: "813547250594",
  appId: "1:813547250594:web:777686d6503b966c9d08fb",
  measurementId: "G-4G8SRM2RT6"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// -------------------------
// DOM References
// -------------------------
const DOM = {
  loginContainer: document.getElementById("login-container"),
  videosContainer: document.getElementById("videos-container"),
  adminContainer: document.getElementById("admin-container"),
  addVideoForm: document.getElementById("admin-form"),
  adminMessage: document.getElementById("admin-message"),
  logoutBtn: document.getElementById("logout-btn"),
  loginForm: document.getElementById("login-form"),
  loading: document.getElementById("loading"),
  videoList: document.querySelector(".list")
};

// -------------------------
// Utility Functions
// -------------------------
function usernameToEmail(username) {
  return username.trim().toLowerCase() + "@vat.in";
}

function showContainer(containerName) {
  DOM.loginContainer.style.display = "none";
  DOM.videosContainer.style.display = "none";
  DOM.adminContainer.style.display = "none";

  if (containerName === "login") DOM.loginContainer.style.display = "block";
  else if (containerName === "videos") DOM.videosContainer.style.display = "block";
  else if (containerName === "admin") DOM.adminContainer.style.display = "block";
}

// -------------------------
// Login Logic
// -------------------------
if (DOM.loginForm) {
  DOM.loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    try {
      await auth.signInWithEmailAndPassword(usernameToEmail(username), password);
      DOM.loginForm.reset();
    } catch (err) {
      alert("Login failed: " + err.message);
      console.error(err);
    }
  });
}

// -------------------------
// Load Videos
// -------------------------
async function loadVideos() {
  if (!DOM.videoList) return;
  DOM.videoList.innerHTML = "";

  try {
    const snapshot = await db.collection("videos").get();
    snapshot.forEach(doc => {
      const { title, url } = doc.data();
      const item = document.createElement("a");
      item.className = "item";
      item.href = url;
      item.target = "_blank";

      const thumbnail = document.createElement("div");
      thumbnail.className = "thumbnail";
      thumbnail.textContent = title;

      item.appendChild(thumbnail);
      DOM.videoList.appendChild(item);
    });
  } catch (err) {
    console.error("Error loading videos:", err);
  }
}

// -------------------------
// Admin Add Video
// -------------------------
if (DOM.addVideoForm) {
  DOM.addVideoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("video-title").value.trim();
    const url = document.getElementById("video-url").value.trim();
    if (!title || !url) return;

    try {
      await db.collection("videos").add({ title, url });
      if (DOM.adminMessage) DOM.adminMessage.textContent = "Video added successfully!";
      DOM.addVideoForm.reset();
      loadVideos();
    } catch (err) {
      if (DOM.adminMessage) DOM.adminMessage.textContent = "Error adding video: " + err.message;
      console.error(err);
    }
  });
}

// -------------------------
// Logout Logic
// -------------------------
if (DOM.logoutBtn) {
  DOM.logoutBtn.addEventListener("click", async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    }
  });
}

// -------------------------
// Auth State Listener
// -------------------------
auth.onAuthStateChanged(async (user) => {
  if (DOM.loading) DOM.loading.style.display = "none";

  if (user) {
    const email = user.email.toLowerCase();
    if (email === "shitshow@vat.in") {
      showContainer("admin");
      DOM.videosContainer.style.display = "block"; // admin sees videos
    } else {
      showContainer("videos");
    }
    loadVideos();
    if (DOM.logoutBtn) DOM.logoutBtn.style.display = "block";
  } else {
    showContainer("login");
    if (DOM.logoutBtn) DOM.logoutBtn.style.display = "none";
  }
});
