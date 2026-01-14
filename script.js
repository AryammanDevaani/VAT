const App = (() => {
  const Config = {
    firebase: {
      apiKey: "AIzaSyCGecLDtzjqcnNnedy6EVpsKJ2SZ6sNZEc",
      authDomain: "vachanaryammantirth.firebaseapp.com",
      projectId: "vachanaryammantirth",
      storageBucket: "vachanaryammantirth.appspot.com",
      messagingSenderId: "813547250594",
      appId: "1:813547250594:web:777686d6503b966c9d08fb",
      measurementId: "G-4G8SRM2RT6"
    },
    emailDomain: "@vat.in",
    loadingDuration: 2000
  };

  const State = {
    isFirstLoad: true,
    loadingStartTime: 0,
    messageTimeout: null
  };

  firebase.initializeApp(Config.firebase);
  const auth = firebase.auth();
  const db = firebase.firestore();

  const DOM = {
    containers: {
      login: document.getElementById("login-container"),
      videos: document.getElementById("videos-container"),
      admin: document.getElementById("admin-container"),
      loading: document.getElementById("loading"),
    },
    forms: {
      login: document.getElementById("login-form"),
      addVideo: document.getElementById("add-video-form"),
    },
    inputs: {
      videoTitle: document.getElementById("video-title"),
      videoUrl: document.getElementById("video-url"),
    },
    messages: {
      login: document.getElementById("login-message"),
      admin: document.getElementById("admin-message"),
    },
    buttons: {
      logout: document.getElementById("logout-btn"),
    },
    lists: {
      videos: document.querySelector(".list"),
    },
    loading: {
      bar: document.querySelector(".progress-bar"),
      fill: null
    }
  };

  const UI = {
    init: () => {
      const fill = document.createElement("div");
      fill.className = "progress-fill";
      if (DOM.loading.bar) {
        DOM.loading.bar.innerHTML = "";
        DOM.loading.bar.appendChild(fill);
        DOM.loading.fill = fill;
      }
    },

    showContainer: (containerName) => {
      Object.values(DOM.containers).forEach(el => {
        if (el && el.id !== 'loading') el.style.display = "none";
      });

      if (containerName === "login") {
        UI.injectLoginInputs();
        DOM.containers.login.style.display = "block";
      } else if (containerName === "app") {
        DOM.containers.videos.style.display = "block";
      }
      
      if (containerName === "admin") {
         DOM.containers.admin.style.display = "block";
         DOM.containers.videos.style.display = "block";
      }
    },

    injectLoginInputs: () => {
      if (!document.getElementById("username")) {
        DOM.forms.login.innerHTML = `
          <input type="text" id="username" placeholder="username" autocomplete="username" required>
          <input type="password" id="password" placeholder="password" autocomplete="current-password" required>
          <button type="submit">login</button>
        `;
      }
    },

    showMessage: (element, text, isSuccess = false) => {
      if (State.messageTimeout) clearTimeout(State.messageTimeout);

      element.textContent = text;
      element.style.opacity = "1";
      element.className = `message ${isSuccess ? 'success' : ''}`;

      State.messageTimeout = setTimeout(() => {
        element.style.opacity = "0";
        setTimeout(() => element.textContent = "", 500);
      }, 3000);
    },

    triggerErrorShake: (container) => {
      const inputs = container.querySelectorAll("input");
      container.classList.add("shake-animation");
      inputs.forEach(input => input.classList.add("input-error"));

      setTimeout(() => {
        container.classList.remove("shake-animation");
        inputs.forEach(input => input.classList.remove("input-error"));
      }, 500);
    },

    renderVideoList: (videos) => {
      DOM.lists.videos.innerHTML = "";
      DOM.lists.videos.style.transform = "scale(0.95)";

      const fragment = document.createDocumentFragment();

      videos.forEach(({ title, url, order }) => {
        const item = document.createElement("a");
        item.className = "item";
        item.href = url;
        item.target = "_blank";
        item.rel = "noopener noreferrer";

        item.innerHTML = `
          <div class="thumbnail">
            <div class="order-number">${order}</div>
            <div>${title}</div>
          </div>
        `;
        fragment.appendChild(item);
      });

      DOM.lists.videos.appendChild(fragment);

      requestAnimationFrame(() => {
        DOM.lists.videos.style.transition = "transform 0.3s ease";
        DOM.lists.videos.style.transform = "scale(1)";
      });
    }
  };

  const Loading = {
    start: () => {
      if (!DOM.containers.loading) return;
      
      DOM.containers.loading.style.display = "flex";
      DOM.loading.fill.className = "progress-fill";
      DOM.loading.fill.style.width = "0%";
      
      State.loadingStartTime = Date.now();

      void DOM.loading.fill.offsetWidth; 

      const randomPercent = Math.floor(Math.random() * (90 - 30 + 1) + 30);
      requestAnimationFrame(() => {
        DOM.loading.fill.classList.add("filling");
        DOM.loading.fill.style.width = `calc(${randomPercent}% - 4px)`;
      });
    },

    finish: async () => {
      const elapsed = Date.now() - State.loadingStartTime;
      const remaining = Math.max(0, Config.loadingDuration - elapsed);

      if (remaining > 0) {
        await new Promise(r => setTimeout(r, remaining));
      }

      DOM.loading.fill.classList.remove("filling");
      DOM.loading.fill.classList.add("complete");
      DOM.loading.fill.style.width = "calc(100% - 4px)";

      await new Promise(r => setTimeout(r, 800));
      DOM.containers.loading.style.display = "none";
    }
  };

  const Data = {
    getVideos: async () => {
      try {
        const snapshot = await db.collection("videos").orderBy("order").get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error("Fetch error:", error);
        return [];
      }
    },

    addVideo: async (title, url, position = null) => {
      const videosRef = db.collection("videos");
      const currentVideos = await Data.getVideos();
      
      let newOrder = position === null || position > currentVideos.length 
        ? currentVideos.length + 1 
        : position;

      if (newOrder <= currentVideos.length) {
        const batch = db.batch();
        currentVideos.forEach(video => {
          if (video.order >= newOrder) {
            batch.update(videosRef.doc(video.id), { order: video.order + 1 });
          }
        });
        await batch.commit();
      }

      await videosRef.add({ title, url, order: newOrder });
    },

    login: async (username, password) => {
      const email = username.trim().toLowerCase() + Config.emailDomain;
      return auth.signInWithEmailAndPassword(email, password);
    },

    logout: () => auth.signOut()
  };

  const setupEvents = () => {
    DOM.forms.login.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userField = document.getElementById("username");
      const passField = document.getElementById("password");
      
      if (!userField || !passField) return;

      try {
        await Data.login(userField.value, passField.value);
        DOM.forms.login.reset();
      } catch (error) {
        UI.triggerErrorShake(DOM.containers.login);
      }
    });

    DOM.forms.addVideo.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = DOM.inputs.videoTitle.value.trim();
      const url = DOM.inputs.videoUrl.value.trim();

      if (!title || !url) {
        UI.showMessage(DOM.messages.admin, "Enter both title and URL");
        return;
      }

      UI.showMessage(DOM.messages.admin, "Adding video...", true);
      
      try {
        await Data.addVideo(title, url);
        UI.showMessage(DOM.messages.admin, "Success!", true);
        DOM.forms.addVideo.reset();
        
        const videos = await Data.getVideos();
        UI.renderVideoList(videos);
      } catch (error) {
        UI.showMessage(DOM.messages.admin, "Error adding video");
      }
    });

    DOM.buttons.logout.addEventListener("click", () => {
      Data.logout().catch(console.error);
    });
  };

  const init = () => {
    UI.init();
    Loading.start();
    setupEvents();

    auth.onAuthStateChanged(async (user) => {
      if (!State.isFirstLoad) Loading.start();
      
      await Loading.finish();

      if (user) {
        const token = await user.getIdTokenResult();
        const isAdmin = token.claims.admin;
        
        UI.showContainer(isAdmin ? "admin" : "app");
        DOM.buttons.logout.style.display = "block";
        
        const videos = await Data.getVideos();
        UI.renderVideoList(videos);
      } else {
        UI.showContainer("login");
        DOM.buttons.logout.style.display = "none";
      }

      State.isFirstLoad = false;
    });
  };

  return { init };
})();

App.init();