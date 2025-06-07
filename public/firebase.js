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
// 💾 DOM References
// ─────────────────────────────
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signUpBtn = document.getElementById("signUpBtn");
const signInBtn = document.getElementById("signInBtn");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeSpan = document.getElementById("welcome");

let signUpMode = false;

// ─────────────────────────────
// 🧠 User State
// ─────────────────────────────
let currentUser = null;
let points = 0;

// ─────────────────────────────
// 🔁 Auth Listener
// ─────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const handle = user.email?.split("@")[0] || "User";
    welcomeSpan.textContent = `Welcome, ${handle}`;
    welcomeSpan.style.display = "inline-block";

    logoutBtn.style.display = "inline-block";
    emailInput.style.display = "none";
    passwordInput.style.display = "none";
    signUpBtn.style.display = "none";
    signInBtn.style.display = "none";
    googleLoginBtn.style.display = "none";
    signUpMode = false;
    signUpBtn.textContent = "Sign Up";

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
    welcomeSpan.textContent = "";
    welcomeSpan.style.display = "none";
    logoutBtn.style.display = "none";

    emailInput.style.display = "inline-block";
    passwordInput.style.display = "inline-block";
    signUpBtn.style.display = "inline-block";
    signInBtn.style.display = "inline-block";
    googleLoginBtn.style.display = "inline-block";
    signUpMode = false;
    signUpBtn.textContent = "Sign Up";

    window.firebaseGame = null;
  }
});

// ─────────────────────────────
// 🔐 Auth Actions
// ─────────────────────────────
window.startSignUp = async () => {
  if (!signUpMode) {
    signUpMode = true;
    signInBtn.style.display = "none";
    googleLoginBtn.style.display = "none";
    signUpBtn.textContent = "Create Account";
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
    location.reload();
  } catch (err) {
    console.error("Logout Error:", err.message);
  }
};
