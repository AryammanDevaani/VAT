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

let messageTimeout;

function usernameToEmail(username) {
  return username.trim().toLowerCase() + "@vat.in";
}

function showMessage(element, message, isSuccess = false, duration = 3000) {
  if (messageTimeout) clearTimeout(messageTimeout);
  
  element.textContent = message;
  element.style.opacity = "1";
  element.style.maxHeight = "100px";
  
  if (isSuccess) {
    element.classList.add("success");
  } else {
    element.classList.remove("success");
  }

  messageTimeout = setTimeout(() => {
    element.style.opacity = "0";
    element.style.maxHeight = "0";
  }, duration);

  messageTimeout = setTimeout(() => {
    element.textContent = "";
  }, duration + 500);
}

function showContainer(containerName) {
  [DOM.loginContainer, DOM.videosContainer, DOM.adminContainer]
    .forEach(container => container.style.display = "none");
  
  if (containerName === "login") DOM.loginContainer.style.display = "block";
  if (containerName === "videos") DOM.videosContainer.style.display = "block";
  if (containerName === "admin") DOM.adminContainer.style.display = "block";
}

function showLoading() {
  if (DOM.loading) DOM.loading.style.display = "flex";
}

function hideLoading() {
  if (DOM.loading) DOM.loading.style.display = "none";
}

async function loadVideos() {
  if (!DOM.videoList) return;
  
  DOM.videoList.innerHTML = "";
  DOM.videoList.style.transform = "scale(0.95)";
  
  try {
    const snapshot = await db.collection("videos").orderBy("order").get();
    snapshot.forEach(doc => {
      const { title, url, order } = doc.data();
      createVideoItem(title, url, order);
    });
    
    requestAnimationFrame(() => {
      DOM.videoList.style.transition = "transform 0.3s ease";
      DOM.videoList.style.transform = "scale(1)";
    });
  } catch (err) {
    console.error("Error loading videos:", err);
  }
}

function createVideoItem(title, url, order) {
  const item = document.createElement("a");
  item.className = "item";
  item.href = url;
  item.target = "_blank";
  
  const thumbnail = document.createElement("div");
  thumbnail.className = "thumbnail";
  
  const orderBadge = document.createElement("div");
  orderBadge.className = "order-number";
  orderBadge.textContent = order;
  
  const titleText = document.createElement("div");
  titleText.textContent = title;
  
  thumbnail.appendChild(orderBadge);
  thumbnail.appendChild(titleText);
  item.appendChild(thumbnail);
  DOM.videoList.appendChild(item);
}

async function addVideo(title, url, position = null) {
  const videosRef = db.collection("videos");
  const snapshot = await videosRef.orderBy("order").get();
  const videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  let newOrder;
  if (position === null || position > videos.length) {
    newOrder = videos.length + 1;
  } else {
    newOrder = position;
    const batch = db.batch();
    videos.forEach(video => {
      if (video.order >= position) {
        batch.update(videosRef.doc(video.id), { order: video.order + 1 });
      }
    });
    await batch.commit();
  }
  
  await videosRef.add({ title, url, order: newOrder });
}

function setupEventListeners() {
  DOM.loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showLoading();
    
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    
    if (!username || !password) {
      showMessage(DOM.loginMessage, "Enter both username and password!");
      hideLoading();
      return;
    }
    
    try {
      await auth.signInWithEmailAndPassword(usernameToEmail(username), password);
      DOM.loginForm.reset();
      DOM.adminMessage.textContent = "";
      DOM.loginMessage.textContent = "";
    } catch (error) {
      showMessage(DOM.loginMessage, "Login failed!");
    } finally {
      hideLoading();
    }
  });

  DOM.addVideoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const title = document.getElementById("video-title").value.trim();
    const url = document.getElementById("video-url").value.trim();
    
    if (!title || !url) {
      showMessage(DOM.adminMessage, "Enter both the title and URL!");
      return;
    }
    
    showLoading();
    try {
      await addVideo(title, url);
      showMessage(DOM.adminMessage, "Video added successfully!", true);
      DOM.addVideoForm.reset();
      await loadVideos();
    } catch (error) {
      showMessage(DOM.adminMessage, "Error adding video!");
    } finally {
      hideLoading();
    }
  });

  DOM.logoutBtn.addEventListener("click", async () => {
    showLoading();
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      hideLoading();
    }
  });
}

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

setupEventListeners();
