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
  videoList: document.querySelector(".list"),
  progressBar: document.querySelector(".progress-bar")
};

// 1. SETUP: Create the fill element
const progressFill = document.createElement("div");
progressFill.className = "progress-fill";
if (DOM.progressBar) {
  DOM.progressBar.innerHTML = "";
  DOM.progressBar.appendChild(progressFill);
}

let loadingTimeout; // NEW: Holds the timer ID

function startLoadingSequence() {
  // Clear any existing timer to prevent overlaps
  if (loadingTimeout) clearTimeout(loadingTimeout);

  // Ensure it is HIDDEN initially
  if (DOM.loading) DOM.loading.style.display = "none";
  
  if (progressFill) {
    progressFill.className = "progress-fill"; 
    progressFill.style.width = "0%";
  }
  
  // START GRACE PERIOD:
  // We wait 500ms. If loading finishes before this, the code inside never runs.
  loadingTimeout = setTimeout(() => {
    if (DOM.loading) {
      DOM.loading.style.display = "flex"; // NOW we show it
      
      loadingStartTime = Date.now();
      void progressFill.offsetWidth; 
      
      const randomPercent = Math.floor(Math.random() * (90 - 30 + 1) + 30);
      requestAnimationFrame(() => {
        progressFill.classList.add("filling");
        progressFill.style.width = `calc(${randomPercent}% - 4px)`;
      });
    }
  }, 500); // 500ms delay
}

async function finishLoadingSequence() {
  // CRITICAL: Cancel the "show" timer immediately!
  // If this runs before 500ms, the loading screen never turns to "flex".
  if (loadingTimeout) clearTimeout(loadingTimeout);
  
  // Check if it's actually visible
  const isVisible = DOM.loading && window.getComputedStyle(DOM.loading).display !== "none";

  // If it's hidden, we are done. No flash, no animation.
  if (!isVisible) {
    return;
  }
  
  // If we are here, the screen IS visible, so we animate the completion cleanly.
  progressFill.classList.remove("filling");
  progressFill.classList.add("complete");
  progressFill.style.width = "calc(100% - 4px)";
  
  await new Promise(r => setTimeout(r, 300));
  await new Promise(r => setTimeout(r, 500));
  
  if (DOM.loading) DOM.loading.style.display = "none";
}

let messageTimeout;

function usernameToEmail(username) {
  return username.trim().toLowerCase() + "@vat.in";
}

function showMessage(element, message, isSuccess = false, duration = 3000) {
  if (messageTimeout) clearTimeout(messageTimeout);
  
  element.textContent = message;
  element.style.opacity = "1";
  
  if (isSuccess) {
    element.classList.add("success");
  } else {
    element.classList.remove("success");
  }

  messageTimeout = setTimeout(() => {
    element.style.opacity = "0";
  }, duration);

  messageTimeout = setTimeout(() => {
    element.textContent = "";
  }, duration + 500);
}

function triggerLoginError() {
  const inputs = DOM.loginContainer.querySelectorAll("input");
  DOM.loginContainer.classList.add("shake-animation");
  inputs.forEach(input => input.classList.add("input-error"));

  setTimeout(() => {
    DOM.loginContainer.classList.remove("shake-animation");
    inputs.forEach(input => input.classList.remove("input-error"));
  }, 500);
}

function injectLoginInputs() {
  if (!document.getElementById("username")) {
    DOM.loginForm.innerHTML = `
      <input type="text" id="username" placeholder="username" required>
      <input type="password" id="password" placeholder="password" required>
      <button type="submit">login</button>
    `;
  }
}

function showContainer(containerName) {
  [DOM.loginContainer, DOM.videosContainer, DOM.adminContainer]
    .forEach(container => container.style.display = "none");
  
  if (containerName === "login") {
    injectLoginInputs();
    DOM.loginContainer.style.display = "block";
  }
  if (containerName === "videos") DOM.videosContainer.style.display = "block";
  if (containerName === "admin") DOM.adminContainer.style.display = "block";
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
    
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    if (!usernameInput || !passwordInput) return;

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username || !password) {
      triggerLoginError();
      return;
    }
    
    try {
      await auth.signInWithEmailAndPassword(usernameToEmail(username), password);
      DOM.loginForm.reset();
      DOM.adminMessage.textContent = "";
    } catch (error) {
      triggerLoginError();
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
    
    showMessage(DOM.adminMessage, "Adding video...", true);
    
    try {
      await addVideo(title, url);
      showMessage(DOM.adminMessage, "Video added successfully!", true);
      DOM.addVideoForm.reset();
      await loadVideos();
    } catch (error) {
      showMessage(DOM.adminMessage, "Error adding video!");
    }
  });

  DOM.logoutBtn.addEventListener("click", async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  });
}

// 3. START: Trigger loading logic (which now includes the wait)
startLoadingSequence();

let loadingStartTime = Date.now();
let isFirstLoad = true;

auth.onAuthStateChanged(async (user) => {
  if (!isFirstLoad) {
    startLoadingSequence();
  }

  // This will cancel the timer if it's fast!
  await finishLoadingSequence();

  if (user) {
    const token = await user.getIdTokenResult();
    
    if (token.claims.admin) {
      showContainer("admin");
      DOM.videosContainer.style.display = "block";
    } else {
      showContainer("videos");
    }
    
    await loadVideos();
    DOM.logoutBtn.style.display = "block";
  } else {
    showContainer("login");
    DOM.logoutBtn.style.display = "none";
  }
  
  isFirstLoad = false;
});

setupEventListeners();