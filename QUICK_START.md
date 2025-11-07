# 🚀 Quick Start Guide

## Problem: Images Loading Late / Connection Closed

**Cause**: Ngrok tunnels expire/close and need to be restarted.

## ✅ Quick Fix (3 Steps)

### Step 1: Start Backend
Double-click: `start-backend.bat`
- This opens 2 windows: Backend Server + Ngrok tunnel
- Copy the ngrok URL (e.g., `https://xyz-abc-123.ngrok-free.dev`)

### Step 2: Update Backend CORS
Open `backend/server.js` and update line ~31:
```javascript
origin: "https://YOUR-NEW-FRONTEND-NGROK-URL.ngrok-free.dev",
```

### Step 3: Start Frontend
Double-click: `start-frontend.bat`
- This opens 2 windows: Vite Dev Server + Ngrok tunnel
- Copy the ngrok URL (e.g., `https://abc-xyz-456.ngrok-free.dev`)

### Step 4: Update Frontend API URL
Open `src/views/Dino.jsx` and update line ~9:
```javascript
const API_BASE = "https://YOUR-NEW-BACKEND-NGROK-URL.ngrok-free.dev";
```

---

## 📋 Current URLs (Update These!)

**Backend Ngrok**: `https://manage.iamdino.org`
**Frontend Ngrok**: `https://pussly-retreatal-veda.ngrok-free.dev`

These change every time you restart ngrok!

---

## 🎮 Test Your Setup

1. Visit your **frontend ngrok URL** in browser
2. Navigate to the Dino game
3. Images should load instantly ✅
4. Play a game and check if rewards work ✅

---

## 🐛 Troubleshooting

**Images still not loading?**
- Check if frontend ngrok tunnel is running
- Verify the ngrok URL matches what's in your browser

**500 errors?**
- Check if backend ngrok tunnel is running
- Verify backend URL in `Dino.jsx` is correct
- Check backend server console for detailed errors

**CORS errors?**
- Update `origin` in `backend/server.js` with frontend ngrok URL
- Restart backend server after changes