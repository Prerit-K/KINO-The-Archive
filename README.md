# KINO | The Archive v1.5.3 🎬

> "Performance is not a feature. It is the Director's cut."

**KINO** is a high-performance, glassmorphic vault for your cinematic history. Built with a "Directorial" mindset, it trades boring standard UI for a high-contrast, Noir-Crimson aesthetic that looks better than whatever you're currently using.

It runs on **Vanilla JS**, **Serverless Functions**, and **pure spite**.

---

## 📡 v1.5.3: The "Ghost Signal" Update (Current)

**The Problem:** ISPs started blocking TheMovieDB API. The app went dark for many users.
**The Solution:** We evolved.

v1.5.3 introduces a **Serverless Proxy Architecture**. Instead of the browser fetching data directly (and getting blocked), KINO now routes requests through a secure Vercel Serverless Function. This bypasses censorship, hides the API key from the frontend, and improves security.

**The signal is back. Louder than ever.**

---

## ⚡ Key Features

### **1. The Obsidian Protocol (Mobile UI)**
* **Fluid Dock:** A bottom navigation bar that reacts to your scroll. It hides when you're immersed, and bounces back when you need it.
* **Haptics:** Every touch has a visual "weight" and physics-based recoil.
* **Gesture Control:** Double-tap "Home" to trigger the Railgun Search.

### **2. Serverless Architecture**
* **Zero-Config Proxy:** A Node.js backend (`/api/tmdb.js`) handles all data fetching.
* **Security:** API Keys are never exposed to the client. They live in the cloud.

### **3. "Railgun" Search**
* **Smart Routing:** Instantly switches between searching for Movies, TV Shows, and Directors.
* **Mixed Results:** Finds a director? It pulls their best movies automatically.

### **4. Identity System**
* **The Archive Pass:** A dynamically generated, 3D-tilt enabled ID card that tracks your watch history.
* **Gamified Ranks:** Evolve from "Novice" to "Master" based on your watch count.

---

## 🛠 Tech Stack (The Pure Stuff)

* **Frontend:** Vanilla JavaScript (ES6+), CSS3 (Hardware Accelerated)
* **Backend:** Node.js (Vercel Serverless Functions)
* **Engine:** The Movie Database (TMDB) API
* **PWA:** Service Workers (Offline Capable)
* **Persistence:** LocalStorage (Client-Side Database)

---

## 🔮 The Roadmap

1.  **The Cloud Upgrade:** `LocalStorage` is still fragile. A real database (Supabase/Firebase) is the next major arc.
2.  **Social Sync:** Share your "Archive Pass" with a live link.

---

## 🖋 Credits

* **Lead Architect:** PreritK.
* **Consultant:** A heavily bullied Gemini AI.
* **Fuel Source:** 55+ re-watches of *Ben 10: Alien Force*.

*It’s Hero Time. Muaaaa*

