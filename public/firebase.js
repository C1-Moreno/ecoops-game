// ─────────────────────────────────────────────
// 📡 Firebase Integration (Update Config Below)
// ─────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─────────────────────────────
// 🔑 Replace with your config
// ─────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyA7wmhxfqxDDc1NgI6cPIi_tFGArVL3pZI",
  authDomain: "ecoops-game.firebaseapp.com",
  projectId: "ecoops-game",
  storageBucket: "ecoops-game.appspot.com",
  messagingSenderId: "116048498403",
  appId: "1:116048498403:web:9b0bc9768a47e273397fd6",
};

// ─────────────────────────────
// 🔄 Initialize Firebase
// ─────────────────────────────
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ─────────────────────────────
// 💾 DOM References - UPDATED FOR NEW STRUCTURE
// ─────────────────────────────
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signUpBtn = document.getElementById("signUpBtn");
const signInBtn = document.getElementById("signInBtn");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeSpan = document.getElementById("welcome");

// NEW: Auth state containers
const authLoggedOut = document.getElementById("authLoggedOut");
const authLoggedIn = document.getElementById("authLoggedIn");

let signUpMode = false;

// ─────────────────────────────
// 🧠 User State
// ─────────────────────────────
let currentUser = null;
let points = 0;

// ─────────────────────────────
// 🎨 Helper Functions for Auth State
// ─────────────────────────────
function showLoggedInState(user) {
  const handle = user.email?.split("@")[0] || "User";
  
  // Show logged-in container, hide logged-out container
  if (authLoggedOut) authLoggedOut.style.display = "none";
  if (authLoggedIn) authLoggedIn.style.display = "flex";
  
  // Update welcome text
  if (welcomeSpan) {
    welcomeSpan.textContent = `Welcome, ${handle}`;
    welcomeSpan.style.display = "inline-block";
  }
  
  // Show logout button
  if (logoutBtn) logoutBtn.style.display = "inline-block";
  
  // Legacy support: Hide individual elements if they exist
  [emailInput, passwordInput, signUpBtn, signInBtn, googleLoginBtn].forEach(el => {
    if (el) el.style.display = "none";
  });
  
  // Reset sign up mode
  signUpMode = false;
  if (signUpBtn) signUpBtn.textContent = "Sign Up";
}

function showLoggedOutState() {
  // Hide logged-in container, show logged-out container
  if (authLoggedOut) authLoggedOut.style.display = "flex";
  if (authLoggedIn) authLoggedIn.style.display = "none";
  
  // Clear welcome text
  if (welcomeSpan) {
    welcomeSpan.textContent = "";
    welcomeSpan.style.display = "none";
  }
  
  // Hide logout button
  if (logoutBtn) logoutBtn.style.display = "none";
  
  // Legacy support: Show individual elements if they exist
  [emailInput, passwordInput, signUpBtn, signInBtn, googleLoginBtn].forEach(el => {
    if (el) el.style.display = "inline-block";
  });
  
  // Reset sign up mode
  signUpMode = false;
  if (signUpBtn) signUpBtn.textContent = "Sign Up";
}

// ─────────────────────────────
// 🔁 Auth Listener - UPDATED
// ─────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    showLoggedInState(user);

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, { points: 0 });
      points = 0;
    } else {
      points = userSnap.data().points;
    }

    window.firebaseGame = {
      db,
      getUser: () => currentUser,
      getPoints: () => points,
      updatePoints: async (add) => {
        points += add;
        await updateDoc(doc(db, "users", currentUser.uid), { points });
      },
      saveHistory: async (entry) => {
        await addDoc(
          collection(db, `users/${currentUser.uid}/history`),
          entry
        );
      },
      loadHistory: async () => {
        const ref = collection(db, `users/${currentUser.uid}/history`);
        const snap = await getDocs(ref);
        return snap.docs.map((doc) => doc.data());
      },
    };
  } else {
    currentUser = null;
    points = 0;
    showLoggedOutState();
    window.firebaseGame = null;
  }
});

// ─────────────────────────────
// 🔐 Auth Actions - SAME AS BEFORE
// ─────────────────────────────
window.signUp = async () => {
  if (!signUpMode) {
    signUpMode = true;
    if (signInBtn) signInBtn.style.display = "none";
    if (googleLoginBtn) googleLoginBtn.style.display = "none";
    if (signUpBtn) signUpBtn.textContent = "Create Account";
    return;
  }
  try {
    const email = emailInput.value.trim();
    const pass = passwordInput.value.trim();
    await createUserWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    console.error("Signup Error:", err.message);
  }
};

window.signIn = async () => {
  try {
    const email = emailInput.value.trim();
    const pass = passwordInput.value.trim();
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    console.error("Signin Error:", err.message);
  }
};

window.googleLogin = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    console.error("Google Login Error:", err.message);
  }
};

window.logout = async () => {
  try {
    await signOut(auth);
    // Don't reload page, let the auth state change handle UI updates
  } catch (err) {
    console.error("Logout Error:", err.message);
  }
};