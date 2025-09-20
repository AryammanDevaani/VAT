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

const DOM = {
  loginContainer: document.getElementById("login-container"),
  videosContainer: document.getElementById("videos-container"),
  adminContainer: document.getElementById("admin-container"),
  addVideoForm: document.getElementById("add-video-form"),
  adminMessage: document.getElementById("admin-message"),
  loginMessage: document.getElementById("login-message"),
  logoutBtn: document.getElementById("logout-btn"),
  loginForm: document.getElementById("login-form"),
  loading: document.getElementById("loading"),
  videoList: document.querySelector(".list")
};

function usernameToEmail(username) {
  return username.trim().toLowerCase() + "@vat.in";
}

function showContainer(name) {
  DOM.loginContainer.style.display = "none";
  DOM.videosContainer.style.display = "none";
  DOM.adminContainer.style.display = "none";

  if (name === "login") DOM.loginContainer.style.display = "block";
  if (name === "videos") DOM.videosContainer.style.display = "block";
  if (name === "admin") DOM.adminContainer.style.display = "block";
}

async function loadVideos() {
  if (!DOM.videoList) return;
  DOM.videoList.innerHTML = "";
  DOM.videoList.style.counterReset = "video";

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
    console.error("error loading videos!");
  }
}

function showLoading() {
  if (DOM.loading) DOM.loading.style.display = "flex";
}

function hideLoading() {
  if (DOM.loading) DOM.loading.style.display = "none";
}

// LOGIN
DOM.loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showLoading();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    DOM.loginMessage.textContent = "enter both username and password!";
    DOM.adminMessage.classList.remove("success");
    hideLoading();
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(usernameToEmail(username), password);
    DOM.loginForm.reset();
    DOM.adminMessage.textContent = "";
    DOM.loginMessage.textContent = "";
  } catch (err) {
    DOM.adminMessage.textContent = "login failed!";
    DOM.adminMessage.classList.remove("success");
  } finally {
    hideLoading();
  }
});

// ADD VIDEO
DOM.addVideoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("video-title").value.trim();
  const url = document.getElementById("video-url").value.trim();

  if (!title || !url) {
    DOM.adminMessage.textContent = "enter both the title and URL!";
    DOM.adminMessage.classList.remove("success");
    return;
  }

  showLoading();
  try {
    await db.collection("videos").add({ title, url });
    DOM.adminMessage.textContent = "video added successfully!";
    DOM.adminMessage.classList.add("success");
    DOM.addVideoForm.reset();
    await loadVideos();
  } catch (err) {
    DOM.adminMessage.textContent = "error adding video!";
    DOM.adminMessage.classList.remove("success");
  } finally {
    hideLoading();
  }
});

// LOGOUT
DOM.logoutBtn.addEventListener("click", async () => {
  showLoading();
  try {
    await auth.signOut();
  } catch (err) {
    console.error("logout error!");
  } finally {
    hideLoading();
  }
});

// AUTH STATE
auth.onAuthStateChanged(async (user) => {
  hideLoading();
  if (user) {
    const token = await user.getIdTokenResult();

    if (token.claims.admin) {
      showContainer("admin");
      DOM.videosContainer.style.display = "block";
    } else {
      showContainer("videos");
    }

    loadVideos();
    DOM.logoutBtn.style.display = "block";
  } else {
    showContainer("login");
    DOM.logoutBtn.style.display = "none";
  }
});