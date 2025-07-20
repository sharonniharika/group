const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Initialize Firebase Admin
const serviceAccount = require("./firebase-adminsdk.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

console.log("✅ Firebase connected.");

// Routes
app.get("/", (req, res) => res.redirect("/login"));
app.get("/signup", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "signup.html"))
);
app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "login.html"))
);
app.get("/dashboard", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "dashboard.html"))
);

// Signup handler
app.post("/signupUser", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.send("❌ All fields are required.");
  }

  const userRef = db.collection("users").doc(email);
  const existing = await userRef.get();
  if (existing.exists) {
    return res.send("⚠ User already exists. Please log in.");
  }

  await userRef.set({ name, email, password });
  console.log(`✅ User created: ${email}`);
  res.redirect("/login");
});

// Login handler
app.post("/loginUser", async (req, res) => {
  const { email, password } = req.body;
  const userRef = db.collection("users").doc(email);
  const userDoc = await userRef.get();
  if (!userDoc.exists || userDoc.data().password !== password) {
    return res.send("❌ Invalid email or password.");
  }

  console.log(`✅ User logged in: ${email}`);
  res.redirect("/dashboard");
});

// Book parking slot handler
app.post("/bookParking", async (req, res) => {
  const { name, email, slotNumber, date, time } = req.body;
  if (!name || !email || !slotNumber || !date || !time) {
    return res.send("❌ All fields are required.");
  }

  await db.collection("bookings").add({
    name, email, slotNumber, date, time,
    bookedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`✅ Parking booked by ${email}`);
  res.redirect("/dashboard");
});

// Start server
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`🚗 ParkEase running at http://localhost:${PORT}`)
);
