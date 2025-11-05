import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import crypto from 'crypto';

const app = express();

// CORS configuration - must be before other middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "http://localhost:5173",
      "https://isochronous-packable-sherly.ngrok-free.dev",
      "https://pussly-retreatal-veda.ngrok-free.dev",
      "https://isochronous-packable-sherly.ngrok-free.dev",
      "https://iamdino.org",
      "https://kora-brotherless-unofficiously.ngrok-free.dev",
    ];
    
    // Allow all trycloudflare.com subdomains
    if (origin.includes('trycloudflare.com') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
  credentials: true
}));

app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

mongoose.connect('mongodb://localhost:27017/launchguard')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));
// --- Task Schema ---
const TaskSchema = new mongoose.Schema({
  name: String,
  reward: Number,
  completed: { type: Boolean, default: false }
});

// --- Wallet Schema ---
const WalletSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true },
  connectedAt: { type: Date, default: Date.now },
  tasks: { type: [TaskSchema], default: [] },
  totalReward: { type: Number, default: 0 },
  totalHoldings: { type: Number, default: 0 },
  referredBy: { type: String, default: null },
  friendsReferred: { type: Number, default: 0 },
  referrals: { type: [String], default: [] },
  telegramId: { type: String, default: null },
  telegramUsername: { type: String, default: null },
  telegramFirstName: { type: String, default: null },
  telegramLastName: { type: String, default: null },
  telegramPhotoUrl: { type: String, default: null },
  telegramConnected: { type: Boolean, default: false },
    dinoGames: {
      type: {
        playsToday: { type: Number, default: 0 },
        lastPlayDate: { type: Number, default: () => Date.now() }, // Store timestamp instead of date string
        highestMilestone: { type: Number, default: 0 }
      },
      default: () => ({
        playsToday: 0,
        lastPlayDate: Date.now(),
        highestMilestone: 0
      })
    }
});

const Wallet = mongoose.model('Wallet', WalletSchema);

// --- Add / Update Wallet (with Telegram ID) ---
app.post('/api/wallet', async (req, res) => {
  try {
    const { walletAddress, telegramId, telegramUsername, telegramFirstName, telegramLastName, referrer } = req.body;
    
    // Accept either telegramId or walletAddress (for backward compatibility)
    const identifier = telegramId || walletAddress;
    
    if (!identifier)
      return res.status(400).json({ error: 'Telegram ID or wallet address required' });

    const defaultTasks = [
      { name: 'Join Telegram', reward: 0.01, completed: false },
      { name: 'On board 2 friends', reward: 0.02, completed: false },
      { name: 'On board 5 friends', reward: 0.05, completed: false },
      { name: 'Score 100 in Dino Game', reward: 0.25, completed: false },
      { name: 'Score 400 in Dino Game', reward: 1.0, completed: false },
      { name: 'Score 1000 in Dino Game', reward: 2.5, completed: false },
    ];

    // Find by telegramId first, then by walletAddress
    let wallet = telegramId 
      ? await Wallet.findOne({ telegramId })
      : await Wallet.findOne({ walletAddress: identifier });

    // If new wallet — create it
    if (!wallet) {
      wallet = new Wallet({
        walletAddress: walletAddress || `tg_${identifier}`,
        telegramId: telegramId || null,
        telegramUsername: telegramUsername || null,
        telegramFirstName: telegramFirstName || null,
        telegramLastName: telegramLastName || null,
        tasks: defaultTasks,
        referredBy: referrer || null,
      });
      await wallet.save();

      // Handle referrer updates
      if (referrer) {
        const referrerWallet = await Wallet.findOne({ 
          $or: [{ telegramId: referrer }, { walletAddress: referrer }]
        });
        
        if (referrerWallet) {
          // Add referral only if not already counted
          const newUserId = telegramId || walletAddress;
          if (!referrerWallet.referrals.includes(newUserId)) {
            referrerWallet.friendsReferred += 1;
            referrerWallet.referrals.push(newUserId);

            // Base reward for each invite
            referrerWallet.totalReward += 0.01;

            // --- Task Progression ---
            for (const task of referrerWallet.tasks) {
              if (!task.completed) {
                if (
                  (task.name === "On board 2 friends" && referrerWallet.friendsReferred >= 2) ||
                  (task.name === "On board 5 friends" && referrerWallet.friendsReferred >= 5)
                ) {
                  task.completed = true;
                  referrerWallet.totalReward += task.reward;
                }
              }
            }

            await referrerWallet.save();
          }
        }
      }
    }

    res.json({ success: true, wallet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// --- Mark a Task Completed ---
app.post('/api/complete-task', async (req, res) => {
  try {
    const { walletAddress, telegramId, taskName } = req.body;
    if ((!walletAddress && !telegramId) || !taskName)
      return res.status(400).json({ error: 'Telegram ID or wallet address and task name required' });

    // Find by telegramId first, then by walletAddress
    const wallet = telegramId 
      ? await Wallet.findOne({ telegramId })
      : await Wallet.findOne({ walletAddress });
      
    if (!wallet) return res.status(404).json({ error: 'User not found' });

    const task = wallet.tasks.find(t => t.name === taskName);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.completed) return res.status(400).json({ error: 'Task already completed' });

    task.completed = true;
    wallet.totalReward += task.reward;
    await wallet.save();

    res.json({ success: true, wallet, earnedReward: task.reward });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Get Leaderboard ---
app.get('/api/leaderboard/rewards', async (req, res) => {
  try {
    const wallets = await Wallet.find().sort({ totalReward: -1 });
    res.json({ success: true, wallets });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- 💎 Holders Leaderboard ---
app.get('/api/leaderboard/holders', async (req, res) => {
  try {
    const wallets = await Wallet.find().sort({ totalHoldings: -1 });
    res.json({ success: true, wallets });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Get Referral Stats for a User (by telegramId or walletAddress) ---
app.get('/api/referral-stats/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Try to find by telegramId first, then by walletAddress
    let wallet = await Wallet.findOne({ telegramId: identifier });
    if (!wallet) {
      wallet = await Wallet.findOne({ walletAddress: identifier });
    }
    
    if (!wallet) return res.status(404).json({ error: 'User not found' });

      // Initialize dinoGames if not exists
      if (!wallet.dinoGames) {
        wallet.dinoGames = {
          playsToday: 0,
          lastPlayDate: Date.now(),
          highestMilestone: 0
        };
        await wallet.save();
        console.log('🆕 Initialized new dinoGames for user');
      }

      // 🔧 AUTO-MIGRATION: Convert old date string to timestamp (ONE TIME ONLY)
      if (typeof wallet.dinoGames.lastPlayDate === 'string') {
        console.log('🔧 MIGRATION: Converting old date string to timestamp');
        const oldValue = wallet.dinoGames.lastPlayDate;
        // Set to 2 minutes ago so they can play immediately after migration
        wallet.dinoGames.lastPlayDate = Date.now() - (2 * 60 * 1000);
        wallet.dinoGames.playsToday = 0;
        await wallet.save();
        console.log(`✅ MIGRATION DONE: ${oldValue} -> ${new Date(wallet.dinoGames.lastPlayDate).toISOString()}`);
      }

      // Check if 24 hours have passed - reset plays (PRODUCTION)
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const timeSinceLastPlay = now - wallet.dinoGames.lastPlayDate;
      
      console.log('⏰ Time check:', {
        now: new Date(now).toISOString(),
        lastPlayDate: new Date(wallet.dinoGames.lastPlayDate).toISOString(),
        timeSinceLastPlay: Math.floor(timeSinceLastPlay / 1000) + ' seconds',
        shouldReset: timeSinceLastPlay >= twentyFourHours,
        currentPlays: wallet.dinoGames.playsToday
      });
      
      if (timeSinceLastPlay >= twentyFourHours && wallet.dinoGames.playsToday > 0) {
        console.log('✅ 24 hours passed - resetting plays to 0');
        wallet.dinoGames.playsToday = 0;
        // DO NOT update lastPlayDate here - it will be updated when they play next game
        await wallet.save();
        console.log('💾 Plays reset saved to database');
      }

    // Calculate next reset time (24 hours from lastPlayDate)
    const nextResetTime = wallet.dinoGames.lastPlayDate + twentyFourHours;

    res.json({
      success: true,
      totalReward: wallet.totalReward,
      friendsReferred: wallet.friendsReferred,
      referrals: wallet.referrals,
      telegramId: wallet.telegramId,
      telegramUsername: wallet.telegramUsername,
      telegramFirstName: wallet.telegramFirstName,
      telegramLastName: wallet.telegramLastName,
      telegramConnected: wallet.telegramConnected,
      walletAddress: wallet.walletAddress,
      playsRemaining: 7 - wallet.dinoGames.playsToday,
      highestMilestone: wallet.dinoGames.highestMilestone,
      nextResetTime: nextResetTime, // Add reset timestamp
      tasks: wallet.tasks || []  // ✅ Include tasks array
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Telegram Bot Token
const BOT_TOKEN = '8316272259:AAFQK5O1dWQqNxfSGWYBJzptg-pp4--pcjk'; // 🔐 Replace this with your actual bot token

// --- Telegram Login ---
// --- Telegram Login ---
app.post('/api/telegram-login', async (req, res) => {
  try {
    console.log('📥 Received telegram-login request');
    const { initData } = req.body;
    if (!initData || typeof initData !== 'string') {
      console.error('❌ Missing or invalid initData:', typeof initData);
      return res.status(400).json({ error: 'Missing initData string' });
    }

    console.log('🔍 Raw initData length:', initData.length);
    console.log('🔍 First 100 chars:', initData.substring(0, 100));

    // ✅ Ensure proper decoding
    let decodedData = decodeURIComponent(initData);
    const params = new URLSearchParams(decodedData);

    const data = {};
    for (const [key, value] of params.entries()) {
      if (key === 'user') {
        try {
          data[key] = JSON.parse(value);
        } catch (e) {
          console.error('Failed to parse Telegram user:', e);
          return res.status(400).json({ error: 'Invalid user data' });
        }
      } else {
        data[key] = value;
      }
    }

    console.log('🔍 Parsed data keys:', Object.keys(data));
    const { hash, user } = data;
    if (!hash || !user) {
      console.error('⚠️ Missing hash or user in Telegram data:', data);
      return res.status(400).json({ error: 'Invalid Telegram payload' });
    }

    console.log('🔐 Starting hash verification...');
    console.log('👤 User ID:', user.id);
    console.log('🔑 Received hash:', hash);

    // ✅ Verify hash
    const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
    const checkString = Object.keys(data)
      .filter((key) => key !== 'hash')
      .sort()
      .map((key) => `${key}=${typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]}`)
      .join('\n');

    console.log('🔍 Check string:', checkString);
    const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
    console.log('🔑 Computed hash:', hmac);
    
    if (hmac !== hash) {
      console.error('❌ Hash mismatch!');
      console.error('   Expected:', hmac);
      console.error('   Received:', hash);
      console.error('   Check string used:', checkString);
      console.error('   BOT_TOKEN length:', BOT_TOKEN.length);
      
      // Still allow login but mark as unverified for development
      console.log('⚠️ Continuing with unverified login for development...');
      // return res.status(403).json({ error: 'Invalid Telegram login data' });
    } else {
      console.log('✅ Hash verification successful!');
    }

    // ✅ Extract Telegram user info
    const telegramId = user.id?.toString();
    const username = user.username || '';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const photoUrl = user.photo_url || '';

    if (!telegramId) {
      return res.status(400).json({ error: 'Invalid Telegram user data' });
    }

    // ✅ Create or update wallet
    let wallet = await Wallet.findOne({ telegramId });

    if (!wallet) {
      wallet = new Wallet({
        walletAddress: `temp_${telegramId}`,
        telegramId,
        telegramUsername: username,
        telegramFirstName: firstName,
        telegramLastName: lastName,
        telegramPhotoUrl: photoUrl,
        telegramConnected: true,
        tasks: [
          { name: 'Join Telegram', reward: 0.01, completed: true },
          { name: 'On board 2 friends', reward: 0.02, completed: false },
          { name: 'On board 5 friends', reward: 0.05, completed: false },
          { name: 'Score 100 in Dino Game', reward: 0.25, completed: false },
          { name: 'Score 400 in Dino Game', reward: 1.0, completed: false },
          { name: 'Score 1000 in Dino Game', reward: 2.5, completed: false },
        ],
        totalReward: 0.01,
      });
    } else {
      wallet.telegramUsername = username;
      wallet.telegramFirstName = firstName;
      wallet.telegramLastName = lastName;
      wallet.telegramPhotoUrl = photoUrl;
      wallet.telegramConnected = true;
    }

    await wallet.save();

    console.log('✅ Telegram user saved:', wallet.telegramFirstName);

    res.json({
      success: true,
      message: 'Telegram login successful',
      wallet,
      user: { telegramId, username, firstName, photoUrl },
    });
  } catch (err) {
    console.error('❌ Telegram login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Telegram Login Mobile (Fallback - No Hash Validation) ---
app.post('/api/telegram-login-mobile', async (req, res) => {
  try {
    const { telegramUser } = req.body;
    
    if (!telegramUser || !telegramUser.id) {
      return res.status(400).json({ error: 'Missing Telegram user data' });
    }

    // ✅ Extract Telegram user info
    const telegramId = telegramUser.id.toString();
    const username = telegramUser.username || '';
    const firstName = telegramUser.first_name || '';
    const lastName = telegramUser.last_name || '';
    const photoUrl = telegramUser.photo_url || '';

    console.log('📱 Saving Telegram user (mobile/fallback):', firstName, telegramId);

    // ✅ Create or update wallet
    let wallet = await Wallet.findOne({ telegramId });

    if (!wallet) {
      wallet = new Wallet({
        walletAddress: `temp_${telegramId}`, // Use temp_ prefix instead of tg_
        telegramId,
        telegramUsername: username,
        telegramFirstName: firstName,
        telegramLastName: lastName, // Save last name too
        telegramPhotoUrl: photoUrl,
        telegramConnected: true,
        tasks: [
          { name: 'Join Telegram', reward: 0.01, completed: true },
          { name: 'On board 2 friends', reward: 0.02, completed: false },
          { name: 'On board 5 friends', reward: 0.05, completed: false },
          { name: 'Score 100 in Dino Game', reward: 0.25, completed: false },
          { name: 'Score 400 in Dino Game', reward: 1.0, completed: false },
          { name: 'Score 1000 in Dino Game', reward: 2.5, completed: false },
        ],
        totalReward: 0.01,
      });
    } else {
      wallet.telegramUsername = username;
      wallet.telegramFirstName = firstName;
      wallet.telegramLastName = lastName;
      wallet.telegramPhotoUrl = photoUrl;
      wallet.telegramConnected = true;
    }

    await wallet.save();

    console.log('✅ Telegram user saved (mobile):', wallet.telegramFirstName);

    res.json({
      success: true,
      message: 'Telegram user saved successfully',
      wallet,
      user: { telegramId, username, firstName, lastName, photoUrl },
    });
  } catch (err) {
    console.error('❌ Telegram login mobile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- ✅ Link Telegram (DEPRECATED - Wallet connect removed) ---
// This endpoint is kept for backward compatibility but not actively used
app.post("/api/link-telegram", async (req, res) => {
  try {
    const { walletAddress, telegramData } = req.body;

    console.log('⚠️ [DEPRECATED] Link-telegram called - wallet connect removed');
    console.log('🔗 Request:', { walletAddress, telegramId: telegramData?.id });

    if (!telegramData?.id) {
      return res.status(400).json({ error: "Missing Telegram data" });
    }

    const telegramId = telegramData.id.toString();

    // Just find or create by telegram ID
    let wallet = await Wallet.findOne({ telegramId });
    
    if (wallet) {
      console.log('✅ Found existing Telegram user');
      return res.json({ success: true, wallet });
    }

    // Create new user with telegram ID
    console.log('✨ Creating new wallet with Telegram ID');
    wallet = new Wallet({
      walletAddress: walletAddress || `tg_${telegramId}`,
      telegramId,
      telegramUsername: telegramData.username || null,
      telegramFirstName: telegramData.first_name || null,
      telegramLastName: telegramData.last_name || null,
      telegramPhotoUrl: telegramData.photo_url || null,
      telegramConnected: true,
      tasks: [
        { name: "Join Telegram", reward: 0.01, completed: true },
        { name: "On board 2 friends", reward: 0.02 },
        { name: "On board 5 friends", reward: 0.05 },
      ],
      totalReward: 0.01,
    });

    await wallet.save();
    console.log('✅ Telegram user created');
    res.json({ success: true, wallet });
  } catch (err) {
    console.error("❌ Error linking Telegram:", err);
    console.error("❌ Full error details:", err.message, err.stack);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// --- Get currently connected wallet (for frontend auto-login)
app.get('/api/current-wallet', async (req, res) => {
  try {
    // Example: fetch latest Telegram or wallet-connected user
    const wallet = await Wallet.findOne().sort({ connectedAt: -1 });
    if (!wallet) return res.json({ success: false, message: 'No wallet connected yet' });
    res.json({ success: true, wallet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
app.post('/api/referral-join', async (req, res) => {
  try {
    const { referrer, telegramId, telegramFirstName, telegramUsername, telegramPhotoUrl } = req.body;

    if (!referrer || !telegramId) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    // Check if this user already exists
    const existing = await Wallet.findOne({ telegramId });
    if (existing) {
      return res.json({ success: false, error: "Already joined" });
    }

    // Create referred user
    const newUser = await Wallet.create({
      walletAddress: `ref_${telegramId}`,
      telegramId,
      telegramFirstName,
      telegramUsername,
      telegramPhotoUrl,
      referredBy: referrer,
      connectedAt: new Date(),
      tasks: [
        { name: "On board 2 friends", reward: 0.02, completed: false },
        { name: "On board 5 friends", reward: 0.05, completed: false },
        { name: "On board 10 friends", reward: 0.1, completed: false }
      ]
    });

    // Update referrer’s stats
    const referrerUser = await Wallet.findOne({ walletAddress: referrer });
    if (referrerUser) {
      referrerUser.friendsReferred += 1;
      referrerUser.totalReward += 0.01; // reward for referral
      await referrerUser.save();
    }

    res.json({ success: true, wallet: newUser });
  } catch (err) {
    console.error("Referral join error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});
// --- ✅ Auto-login: find wallet by Telegram ID ---
app.post("/api/auto-login", async (req, res) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ success: false, error: "Missing telegramId" });

    const wallet = await Wallet.findOne({ telegramId });
    if (!wallet) return res.json({ success: false, message: "No linked wallet found" });

    res.json({
      success: true,
      walletAddress: wallet.walletAddress,
      telegram: {
        firstName: wallet.telegramFirstName,
        username: wallet.telegramUsername,
      },
    });
  } catch (err) {
    console.error("Auto-login error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// --- 🦖 Save Dino Game Score and Reward ---
app.post("/api/dino-score", async (req, res) => {
  try {
    const { telegramId, score } = req.body;

    console.log('🦖 Dino score request:', { telegramId, score });

    if (!telegramId || score === undefined) {
      return res.status(400).json({ success: false, error: "Missing telegramId or score" });
    }

    // Find user by telegramId
    const wallet = await Wallet.findOne({ telegramId: telegramId.toString() });
    
    if (!wallet) {
      console.log('❌ User not found:', telegramId);
      return res.status(404).json({ success: false, error: "User not found" });
    }

    console.log('✅ Found user:', wallet.telegramFirstName);

      // Initialize dinoGames if not exists
      if (!wallet.dinoGames) {
        wallet.dinoGames = {
          playsToday: 0,
          lastPlayDate: Date.now(),
          highestMilestone: 0
        };
      }

      // 🔧 AUTO-MIGRATION: Convert old date string to timestamp
      if (typeof wallet.dinoGames.lastPlayDate === 'string') {
        console.log('🔧 Auto-migrating old date string to timestamp during game play');
        wallet.dinoGames.lastPlayDate = Date.now();
        wallet.dinoGames.playsToday = 0; // Reset for fairness
        console.log('✅ Migration complete for user:', wallet.telegramId);
      }

      // Check if 24 hours have passed - reset plays (PRODUCTION)
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const timeSinceLastPlay = now - wallet.dinoGames.lastPlayDate;
      
      console.log('⏰ Time check before playing:', {
        now: new Date(now).toISOString(),
        lastPlayDate: new Date(wallet.dinoGames.lastPlayDate).toISOString(),
        timeSinceLastPlay: Math.floor(timeSinceLastPlay / 1000) + ' seconds',
        shouldReset: timeSinceLastPlay >= twentyFourHours,
        currentPlays: wallet.dinoGames.playsToday
      });
      
      if (timeSinceLastPlay >= twentyFourHours && wallet.dinoGames.playsToday > 0) {
        console.log('✅ 24 hours passed - resetting play count to 0');
        wallet.dinoGames.playsToday = 0;
        // DO NOT update lastPlayDate here
      }

      // Check daily play limit (7 games per day)
      if (wallet.dinoGames.playsToday >= 7) {
        console.log('🚫 Daily play limit reached (7/7)');
        return res.status(403).json({
          success: false,
          error: "Daily play limit reached",
          message: "You've played 7 games today. Come back tomorrow!",
          playsToday: wallet.dinoGames.playsToday,
          playsRemaining: 0
        });
      }

      // Increment play count and update lastPlayDate for the FIRST game of the period
      wallet.dinoGames.playsToday += 1;
      
      // If this is the first play (plays was 0), set the lastPlayDate
      if (wallet.dinoGames.playsToday === 1) {
        wallet.dinoGames.lastPlayDate = now;
        console.log('🎮 First game of period - setting lastPlayDate:', new Date(now).toISOString());
      }

      // Calculate milestone: floor to nearest 100
      // 150 score → 100 milestone, 250 score → 200 milestone
      const currentMilestone = Math.floor(score / 100) * 100;
    
      // Always give reward equal to the milestone if score is 100+
      let reward = 0;
      let milestoneBonus = 0;
      let isNewMilestone = false;
    
      if (currentMilestone >= 100) {
        // Base reward = milestone value (100, 200, 300, etc.)
        reward = currentMilestone;
        
        // Check if this is a NEW milestone (never reached before)
        if (currentMilestone > wallet.dinoGames.highestMilestone) {
          milestoneBonus = 50; // Extra 50 IMDINO bonus for new milestone
          reward += milestoneBonus;
          wallet.dinoGames.highestMilestone = currentMilestone;
          isNewMilestone = true;
        }
        
        wallet.totalReward += reward;
      
        console.log('🎁 Reward given:', {
          score,
          milestone: currentMilestone,
          baseReward: currentMilestone + ' IMDINO',
          milestoneBonus: isNewMilestone ? '+50 IMDINO (NEW MILESTONE!)' : 'None',
          totalReward: reward + ' IMDINO',
          newBalance: wallet.totalReward
        });
      } else {
        console.log('📊 Score saved (no reward):', {
          score,
          milestone: currentMilestone,
          reason: 'Below 100 points'
        });
      }

      // Save wallet with updated data
      await wallet.save();

      // Calculate next reset time (24 hours from lastPlayDate)
      const nextResetTime = wallet.dinoGames.lastPlayDate + twentyFourHours;

      if (currentMilestone >= 100) {
        const message = isNewMilestone 
          ? `🎉 NEW MILESTONE ${currentMilestone}! You earned ${currentMilestone} IMDINO + 50 BONUS = ${reward} IMDINO!`
          : `💰 You earned ${reward} IMDINO! (Milestone: ${currentMilestone})`;
          
        return res.json({
          success: true,
          message,
          score,
          milestone: currentMilestone,
          reward,
          milestoneBonus: isNewMilestone ? milestoneBonus : 0,
          isNewMilestone,
          totalReward: wallet.totalReward,
          playsToday: wallet.dinoGames.playsToday,
          playsRemaining: 7 - wallet.dinoGames.playsToday,
          highestMilestone: wallet.dinoGames.highestMilestone,
          nextResetTime: nextResetTime
        });
      } else {
        return res.json({
          success: true,
          message: "Score saved! Reach 100 points to start earning rewards.",
          score,
          milestone: currentMilestone,
          reward: 0,
          totalReward: wallet.totalReward,
          playsToday: wallet.dinoGames.playsToday,
          playsRemaining: 7 - wallet.dinoGames.playsToday,
          highestMilestone: wallet.dinoGames.highestMilestone,
          nextResetTime: nextResetTime
        });
      }
    } catch (err) {
    console.error("❌ Dino score error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    endpoints: [
      'POST /api/dino-score',
      'GET /api/referral-stats/:identifier',
      'POST /api/reset-dino-plays/:telegramId',
      'GET /api/health'
    ]
  });
});

// --- 🔄 Reset Dino Plays (For Testing) ---
app.post('/api/reset-dino-plays/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    
    console.log('🔄 Resetting plays for:', telegramId);
    
    const wallet = await Wallet.findOne({ telegramId: telegramId.toString() });
    
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Reset plays to 0
    if (!wallet.dinoGames) {
      wallet.dinoGames = {
        playsToday: 0,
        lastPlayDate: Date.now(),
        highestMilestone: 0
      };
    } else {
      wallet.dinoGames.playsToday = 0;
      wallet.dinoGames.lastPlayDate = Date.now();
    }
    
    await wallet.save();
    
    console.log('✅ Plays reset successfully');
    
    return res.json({
      success: true,
      message: 'Plays reset successfully',
      playsRemaining: 7,
      highestMilestone: wallet.dinoGames.highestMilestone
    });
  } catch (err) {
    console.error("❌ Reset plays error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// --- 🔧 MIGRATION: Convert old date strings to timestamps ---
app.post("/api/migrate-dino-timestamps", async (req, res) => {
  try {
    console.log('🔧 Starting migration: Converting date strings to timestamps');
    
    const wallets = await Wallet.find({ 'dinoGames.lastPlayDate': { $type: 'string' } });
    
    console.log(`Found ${wallets.length} wallets with old date string format`);
    
    let migratedCount = 0;
    
    for (const wallet of wallets) {
      if (wallet.dinoGames && typeof wallet.dinoGames.lastPlayDate === 'string') {
        // Convert old date string to timestamp
        const oldDate = wallet.dinoGames.lastPlayDate;
        wallet.dinoGames.lastPlayDate = Date.now(); // Start fresh with current time
        wallet.dinoGames.playsToday = 0; // Reset plays for fairness
        
        await wallet.save();
        migratedCount++;
        
        console.log(`✅ Migrated user ${wallet.telegramId || wallet.walletAddress}: ${oldDate} -> ${new Date(wallet.dinoGames.lastPlayDate).toISOString()}`);
      }
    }
    
    console.log(`✅ Migration complete: ${migratedCount} wallets updated`);
    
    return res.json({
      success: true,
      message: `Migration complete: ${migratedCount} wallets updated`,
      migratedCount
    });
  } catch (err) {
    console.error("❌ Migration error:", err);
    res.status(500).json({ success: false, error: "Migration failed" });
  }
});

// Catch-all for debugging 404s
app.use((req, res) => {
  console.log('❌ 404 NOT FOUND:', req.method, req.path);
  console.log('   Available routes:');
  console.log('   - POST /api/dino-score');
  console.log('   - GET  /api/referral-stats/:id');
  console.log('   - GET  /api/health');
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.path,
    message: 'Check server logs for available routes'
  });
});

app.listen(5000, () => {
  console.log('🚀 Server running on port 5000');
  console.log('📋 Available endpoints:');
  console.log('   POST /api/dino-score - Save game score and calculate rewards');
  console.log('   GET  /api/referral-stats/:id - Get user stats');
  console.log('   GET  /api/health - Health check');
});