import BottomNav from "../components/boost/BottomNav";
import React, { useState, useEffect, useRef } from "react";
import CoinBurst from "../components/dino/CoinBurst";
import GameInfoModal from "../components/global/GameInfoModal";
import StatusModal from "../components/global/StatusModal";
import DinoGame from "../components/dino/DinoGame";
import axios from "axios";
import toast from "react-hot-toast";
import { FiRefreshCw } from "react-icons/fi";

// Import stat icons
import PlaysLeftIcon from "../assets/img/stats/PlaysLeft.png";
import MilestoneIcon from "../assets/img/stats/Milestone.png";
import NextGoalIcon from "../assets/img/stats/NextGoal.png";
import CoinIcon from "../assets/img/stats/coin.png";

// TODO: Update this URL to match your current ngrok URL
const API_BASE = "https://isochronous-packable-sherly.ngrok-free.dev";
// For local testing without ngrok, use:
// const API_BASE = "https://isochronous-packable-sherly.ngrok-free.dev";
// NOTE: Switch back to ngrok URL when deploying to Telegram

function Dino() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [totalReward, setTotalReward] = useState(0);
  const [playsRemaining, setPlaysRemaining] = useState(null); // Start as null - not loaded yet
  const [highestMilestone, setHighestMilestone] = useState(0);
  const [showCoins, setShowCoins] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusTitle, setStatusTitle] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [nextResetTime, setNextResetTime] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const dinoGameRef = useRef(null);

  useEffect(() => {
    // Get Telegram user data
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    console.log('🔧 [DINO] Telegram user:', tgUser);
    
    if (tgUser) {
      setUser(tgUser);
      fetchUserData(tgUser.id.toString());
    } else {
      // Development mode fallback - use a test user
      console.warn('⚠️ [DINO] No Telegram user found, using test user for development');
      const testUser = {
        id: 123456789,
        first_name: 'Test User',
        last_name: 'Dev',
        username: 'testuser'
      };
      setUser(testUser);
      fetchUserData(testUser.id.toString());
    }
  }, []);

  const fetchUserData = async (telegramId) => {
    try {
      console.log('🔄 [DINO] Fetching user data for:', telegramId);
      
      // Clear localStorage timer to force it to sync with backend
      localStorage.removeItem('dinoResetTime');
      console.log('🧹 [DINO] Cleared localStorage timer');
      
      const res = await axios.get(`${API_BASE}/api/referral-stats/${telegramId}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      console.log('📦 [DINO] Response data:', res.data);
      if (res.data.success) {
        setTotalReward(res.data.totalReward || 0);
        setHighestMilestone(res.data.highestMilestone || 0);
        setPlaysRemaining(res.data.playsRemaining !== undefined ? res.data.playsRemaining : 7);
        setNextResetTime(res.data.nextResetTime || null);
        setIsDataLoaded(true); // Mark data as loaded
        console.log('✅ [DINO] User data loaded:', {
          totalReward: res.data.totalReward,
          playsRemaining: res.data.playsRemaining,
          highestMilestone: res.data.highestMilestone,
          nextResetTime: res.data.nextResetTime
        });
      }
    } catch (err) {
      console.error("❌ [DINO] Error fetching user data:", err);
      console.error("❌ [DINO] Error details:", err.response?.data);
    }
  };

  const handleGameOver = async (score) => {
    console.log('🎯 [DINO] handleGameOver called with score:', score);
    console.log('🎯 [DINO] User state:', user);
    
    if (!user) {
      console.warn('⚠️ [DINO] No user found');
      toast.error("Please connect your Telegram account");
      return;
    }

    try {
      console.log('📤 [DINO] Sending to backend:', {
        telegramId: user.id.toString(),
        score: score
      });
      
      const response = await axios.post(`${API_BASE}/api/dino-score`, {
        telegramId: user.id.toString(),
        score: score
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 [DINO] Backend response:', response.data);

        // Check if response has success field OR if it has reward data (indicates success)
        const isSuccess = response.data.success !== false && (response.data.success === true || response.data.milestone !== undefined || response.data.reward !== undefined);
      
        if (isSuccess) {
        const { reward, totalReward: newTotal, message, milestone, playsRemaining: newPlays, highestMilestone: newMilestone, nextResetTime: newResetTime } = response.data;
        
        // Update state
          if (newPlays !== undefined) setPlaysRemaining(newPlays);
          if (newMilestone !== undefined) setHighestMilestone(newMilestone);
        if (newResetTime) {
          setNextResetTime(newResetTime);
        }
        
          // Check if reward exists and is greater than 0
          const hasReward = (reward !== undefined && reward > 0) || (milestone !== undefined && milestone >= 100);
        
          if (hasReward) {
            console.log('🎉 [DINO] Reward earned:', reward || milestone);
          // Play celebration sound for milestone
          playMilestoneSound();
          // Show score saved modal first, then game over modal
          setStatusTitle('🎉 Score Saved!');
            const rewardAmount = milestone || reward || 0;
            setStatusMessage(`You earned ${rewardAmount} IMDINO!\n${message || 'Great job!'}\nPlays left today: ${newPlays !== undefined ? newPlays : playsRemaining}`);
          setStatusOpen(true);
            if (newTotal !== undefined) setTotalReward(newTotal);
          setShowCoins(true);
          setTimeout(() => setShowCoins(false), 1200);
        } else {
          console.log('📊 [DINO] No reward (score < 100)');
          // Show score saved modal first, then game over modal
          setStatusTitle('Score saved');
            setStatusMessage(`${message || 'Score saved successfully!'}\nPlays left today: ${newPlays !== undefined ? newPlays : playsRemaining}`);
          setStatusOpen(true);
        }
      } else {
        console.error('❌ [DINO] Backend returned error:', response.data.error);
        toast.error(response.data.message || response.data.error || "Failed to save score");
        
        // Update plays remaining even on error (for daily limit)
        if (response.data.playsRemaining !== undefined) {
          setPlaysRemaining(response.data.playsRemaining);
        }
        
        // Show game over modal even on error
        if (dinoGameRef.current) {
          dinoGameRef.current.showGameOver();
        }
      }
    } catch (error) {
      console.error("❌ [DINO] Error saving score:", error);
      console.error("❌ [DINO] Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Handle 403 (daily limit reached)
      if (error.response?.status === 403) {
        setStatusTitle('Daily limit reached');
        setStatusMessage(error.response.data.message || 'Daily play limit reached!');
        setStatusOpen(true);
        setPlaysRemaining(0);
      } else {
        // Graceful fallback: compute local milestone and show success-style message
        const localMilestone = Math.floor(score / 100) * 100;
        if (localMilestone >= 100) {
          setStatusTitle('🎉 Score Saved!');
          setStatusMessage(`You earned ${localMilestone} IMDINO!\nYour score will sync shortly.`);
          setStatusOpen(true);
        } else {
          setStatusTitle('Score saved');
          setStatusMessage('Score saved locally. Reach 100+ to earn rewards!');
          setStatusOpen(true);
        }
      }
      
      // Show game over modal after info modal
      if (dinoGameRef.current) {
        dinoGameRef.current.showGameOver();
      }
    }
  };

  const handleStatusModalClose = () => {
    setStatusOpen(false);
    // After closing the score saved modal, show the game over modal
    if (dinoGameRef.current) {
      dinoGameRef.current.showGameOver();
    }
  };

  return (
    <div className="w-full h-screen bg-[#0a0b0d] flex flex-col overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, #82ad4b 0.5px, transparent 0.5px), radial-gradient(circle at 80% 80%, #82ad4b 0.5px, transparent 0.5px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Stats Header */}
      {user && (
        <div className="relative z-10 px-4 py-3 bg-[#0a0b0d]/98 backdrop-blur-sm border-b border-[#82ad4b]/20 flex-shrink-0">
          {/* Player Info & Total Earned */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#82ad4b] to-[#6a8f3d] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#82ad4b]/30">
                {user.first_name?.charAt(0)?.toUpperCase() || 'P'}
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Player</div>
                <div className="text-base font-bold text-white tracking-wide">
                  {user.first_name}
                </div>
              </div>
            </div>
            <div className="text-right bg-gradient-to-br from-[#82ad4b]/20 to-[#82ad4b]/5 px-4 py-2 rounded-lg border border-[#82ad4b]/30">
              <div className="text-xs text-gray-400 mb-0.5">Total Earned</div>
              <div className="text-lg font-extrabold text-[#82ad4b] drop-shadow-lg flex items-center justify-end gap-1">
                <img src={CoinIcon} alt="Coin" className="w-7 h-7" />
                {totalReward.toFixed(2)} 
                <span className="text-xs font-normal text-[#82ad4b]/80">IMDINO</span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar and Stats */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-sm rounded-lg px-2 py-1 border border-blue-400/30 shadow-lg hover:scale-105 transition-transform">
              <div className="text-[9px] text-blue-300 mb-0 font-medium">Plays Left</div>
              <div className="font-extrabold text-white text-sm flex items-center justify-center gap-1">
                <img src={PlaysLeftIcon} alt="Plays Left" className="w-3.5 h-3.5" />
                <span className={playsRemaining === 0 ? 'text-red-400' : 'text-white'}>{playsRemaining ?? '...'}</span>
                <span className="text-[10px] text-gray-400">/7</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#82ad4b]/20 to-[#82ad4b]/10 backdrop-blur-sm rounded-lg px-2 py-1 border border-[#82ad4b]/40 shadow-lg hover:scale-105 transition-transform">
              <div className="text-[9px] text-[#a8d966] mb-0 font-medium">Best Milestone</div>
              <div className="font-extrabold text-[#82ad4b] text-sm flex items-center justify-center gap-1">
                <img src={MilestoneIcon} alt="Milestone" className="w-3.5 h-3.5" />
                {highestMilestone}
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 backdrop-blur-sm rounded-lg px-2 py-1 border border-yellow-400/30 shadow-lg hover:scale-105 transition-transform">
              <div className="text-[9px] text-yellow-300 mb-0 font-medium">Next Goal</div>
              <div className="font-extrabold text-yellow-400 text-sm flex items-center justify-center gap-1">
                <img src={NextGoalIcon} alt="Next Goal" className="w-3.5 h-3.5" />
                {highestMilestone + 100}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCoins && <CoinBurst count={18} />}

      {/* Dino Game Component - no more iframe! */}
      <div className="flex-1 w-full relative min-h-0 flex items-start justify-center pt-28">
        {user && isDataLoaded ? (
          <DinoGame 
            ref={dinoGameRef}
            playsRemaining={playsRemaining}
            nextResetTime={nextResetTime}
            onGameOver={handleGameOver}
            onRestart={() => {
              // Refresh data when restarting
              if (user) {
                fetchUserData(user.id.toString());
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#82ad4b] mx-auto mb-4"></div>
              <div className="text-white text-lg">Loading game...</div>
            </div>
          </div>
        )}
      </div>

      {/* Floating buttons */}
      <div className="fixed left-4 bottom-28 z-[60] flex flex-col gap-3">
        {/* Force Reset Button (Testing - manually reset to 7 plays) */}
        <button
          type="button"
          onClick={async () => {
            if (user) {
              try {
                toast.loading('Force resetting...', { id: 'force-reset' });
                await axios.post(`${API_BASE}/api/reset-dino-plays/${user.id}`, {}, {
                  headers: { 'ngrok-skip-browser-warning': 'true' }
                });
                await fetchUserData(user.id.toString());
                toast.success('Reset to 7/7 plays!', { id: 'force-reset' });
              } catch (err) {
                toast.error('Reset failed', { id: 'force-reset' });
              }
            }
          }}
          aria-label="Force reset plays"
          className="h-12 w-12 rounded-full 
            bg-gradient-to-br from-red-500 to-red-700
            text-white font-bold text-sm
            shadow-lg shadow-red-500/50
            hover:shadow-xl hover:shadow-red-500/70
            hover:scale-110
            active:scale-95
            transition-all duration-200
            border-2 border-red-400/30
            flex items-center justify-center"
        >
          🔴
        </button>
        
        {/* Refresh Stats Button (Temporary for debugging) */}
        <button
          type="button"
          onClick={() => {
            if (user) {
              toast.loading('Refreshing stats...', { id: 'refresh' });
              fetchUserData(user.id.toString()).then(() => {
                toast.success('Stats refreshed!', { id: 'refresh' });
              });
            }
          }}
          aria-label="Refresh stats"
          className="h-14 w-14 rounded-full 
            bg-purple-500/10
            text-white font-bold text-sm
            transition-all duration-200
            border-2 border-purple-400/30
            flex items-center justify-center"
        >
          <FiRefreshCw />
        </button>

        {/* Info button */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Game info"
          className="h-14 w-14 rounded-full 
            bg-[#82ad4b]/10
            text-white font-extrabold text-xl
            active:scale-95
            transition-all duration-200
            border-2 border-[#a8d966]/30
            flex items-center justify-center"
        >
          ?
        </button>
      </div>

      <GameInfoModal open={open} onClose={() => setOpen(false)} />
      <StatusModal
        open={statusOpen}
        onClose={handleStatusModalClose}
        title={statusTitle}
        message={statusMessage}
      />
      <BottomNav />
    </div>
  );
}

export default Dino