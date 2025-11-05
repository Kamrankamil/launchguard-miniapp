import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { DinoRunner } from '../../utils/dinoRunner';

interface DinoGameProps {
  playsRemaining: number;
  nextResetTime: number | null;
  onGameOver: (score: number) => void;
  onRestart?: () => void;
}

export interface DinoGameRef {
  showGameOver: () => void;
}

const DinoGame = forwardRef<DinoGameRef, DinoGameProps>(({ playsRemaining, nextResetTime, onGameOver, onRestart }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showStartOverlay, setShowStartOverlay] = useState(true); // Start as true - show immediately
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [gameMessage, setGameMessage] = useState('');
  const runnerRef = useRef<DinoRunner | null>(null);
  const [countdown, setCountdown] = useState('00:00:00');

  // Expose method to parent component
  useImperativeHandle(ref, () => ({
    showGameOver: () => {
      setShowGameOverModal(true);
    }
  }));

  useEffect(() => {
    // Initialize the game when container is ready
    if (containerRef.current && !runnerRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initializeGame();
      }, 100);
      
      return () => {
        clearTimeout(timer);
      };
    }

    return () => {
      // Cleanup
      if (runnerRef.current) {
        runnerRef.current.stop();
        runnerRef.current = null;
      }
    };
  }, []);

  // Update plays remaining when it changes
  useEffect(() => {
    if (playsRemaining <= 0 && !showStartOverlay) {
      setShowStartOverlay(true);
    }
  }, [playsRemaining]);

  // Countdown timer
  useEffect(() => {
    if (playsRemaining !== null && playsRemaining <= 0 && nextResetTime) {
      const updateCountdown = () => {
        const ms = nextResetTime - Date.now();
        if (ms <= 0) {
          setCountdown("00:00:00");
          // Optionally trigger a refresh here
          return;
        }

        const sec = Math.floor(ms / 1000);
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        const pad = (n: number) => (n < 10 ? '0' : '') + n;
        setCountdown(pad(h) + ':' + pad(m) + ':' + pad(s));
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    } else if (playsRemaining !== null && playsRemaining <= 0) {
      // Fallback if nextResetTime is not provided
      setCountdown("--:--:--");
    }
  }, [playsRemaining, nextResetTime]);

  const initializeGame = () => {
    if (!containerRef.current) return;
    
    console.log('🎮 Initializing Dino Game...');
    runnerRef.current = new DinoRunner(containerRef.current, handleGameOverInternal);
  };

  const handleStartGame = () => {
    if (playsRemaining === null || playsRemaining <= 0) {
      console.log('🚫 No plays remaining or data not loaded');
      return;
    }
    
    // Check if we have Telegram user data
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!tgUser) {
      console.warn('⚠️ No Telegram user found when starting game');
      // The parent component should handle this, but just in case
      return;
    }
    
    setShowStartOverlay(false);
    
    // Start the game
    if (runnerRef.current) {
      runnerRef.current.start();
      console.log('✅ Game started');
    }
  };

  const handleGameOverInternal = (score: number) => {
    setGameScore(score);
    
    // Calculate milestone-based reward (same as backend logic)
    const milestone = Math.floor(score / 100) * 100;
    const imdinoEarned = milestone >= 100 ? milestone : 0;
    
    const message = imdinoEarned > 0 
      ? `🎉 You earned ${imdinoEarned} IMDINO!` 
      : 'Score 100+ to earn rewards!';
    setGameMessage(message);
    
    // Don't show game over modal immediately
    // Wait for parent to handle score save first
    onGameOver(score);
  };

  const handlePlayAgain = () => {
    setShowGameOverModal(false);
    if (playsRemaining > 0) {
      if (runnerRef.current) {
        runnerRef.current.restart();
      }
      onRestart?.();
    } else {
      setShowStartOverlay(true);
    }
  };

  return (
    <div className="absolute inset-0 bg-[#0a0b0d] flex flex-col">
      {/* Game Container - DinoRunner will create canvas here */}
      <div
        ref={containerRef}
        id="game-container"
        className="relative w-full h-full z-10 flex items-start justify-center bg-[#0a0b0d]"
        style={{
          maxWidth: '100vw',
          overflow: 'hidden',
          padding: 0,
          margin: 0
        }}
      />

      {/* Start Overlay */}
      {showStartOverlay && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#0a0b0d]/95 z-40 px-3 sm:px-4 pt-4 sm:pt-6 pb-32 sm:pb-40">
          <div className="w-full max-w-[90vw] sm:max-w-[520px] p-4 sm:p-6 rounded-2xl border-2 border-[#82ad4b]/30 bg-[#14151a]/95 shadow-2xl flex flex-col items-center text-center">
            {/* Icon */}
            {playsRemaining !== null && playsRemaining <= 0 && (
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4 shadow-lg shadow-red-500/20">
                <span className="text-4xl">🚫</span>
              </div>
            )}

            {/* Title */}
            <div className="text-xl sm:text-2xl font-black text-white mb-2 drop-shadow-lg">
              {playsRemaining !== null && playsRemaining <= 0 ? 'Daily Limit Reached' : 'Dino Runner'}
            </div>

            {/* Info */}
            <div className="text-gray-300 mb-4 text-xs sm:text-sm">
              {playsRemaining === null
                ? 'Loading...'
                : playsRemaining <= 0
                ? 'Come back tomorrow for more plays!'
                : `${playsRemaining} plays remaining today`}
            </div>

            {/* Countdown Timer (if no plays) */}
            {playsRemaining !== null && playsRemaining <= 0 && (
              <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 mb-4 sm:mb-6 border-2 border-[#82ad4b]/20 rounded-xl bg-white/5 backdrop-blur">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white shadow-lg shadow-[#82ad4b]/60 animate-pulse" />
                <div className="text-white font-bold font-mono tracking-wider text-base sm:text-xl">
                  {countdown}
                </div>
              </div>
            )}

            {/* Start Button */}
            <button
              onClick={handleStartGame}
              disabled={playsRemaining === null || playsRemaining <= 0}
              className={`
                w-full mt-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base
                transition-all duration-200
                ${
                  playsRemaining === null || playsRemaining <= 0
                    ? 'bg-gradient-to-br from-gray-600 to-gray-700 cursor-not-allowed opacity-50 text-gray-400'
                    : 'bg-gradient-to-br from-[#82ad4b] to-[#6a8f3d] hover:shadow-xl hover:shadow-[#82ad4b]/40 hover:scale-105 active:scale-95 text-white'
                }
                border-2 border-[#82ad4b]/30 shadow-lg shadow-[#82ad4b]/40
              `}
            >
              {playsRemaining === null 
                ? 'Loading...' 
                : playsRemaining <= 0 
                ? 'Come back tomorrow' 
                : '🎮 Start Game'}
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {showGameOverModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#0a0b0d]/90 backdrop-blur-sm z-40 p-3 pb-32">
          <div className="max-w-[90vw] sm:max-w-xs w-full bg-[#14151a] rounded-xl border border-[#82ad4b]/30 p-4 sm:p-5 shadow-2xl text-center animate-slideUp">
            {/* Icon */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 bg-gradient-to-br from-[#82ad4b]/20 to-[#82ad4b]/10 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-[#82ad4b]/30 animate-bounce">
              🏆
            </div>

            {/* Title */}
            <div className="text-base sm:text-lg font-black text-white mb-2 sm:mb-3">
              Game Over!
            </div>

            {/* Message */}
            <div className="px-2 sm:px-3 py-1.5 sm:py-2 mb-2 sm:mb-3 bg-[#82ad4b]/8 rounded-lg text-[10px] sm:text-xs font-semibold text-[#82ad4b] min-h-[20px] sm:min-h-[24px] flex items-center justify-center">
              {gameMessage}
            </div>

            {/* Score */}
            <div className="bg-gradient-to-br from-[#82ad4b]/15 to-[#82ad4b]/5 border border-[#82ad4b]/30 rounded-lg py-2 sm:py-2.5 px-3 sm:px-4 mb-3 sm:mb-4 flex flex-col items-center justify-center">
              <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide mb-0.5 sm:mb-1">
                Your Score
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#82ad4b] drop-shadow-lg">
                {gameScore}
              </span>
            </div>

            {/* Play Again Button */}
            <button
              onClick={handlePlayAgain}
              disabled={playsRemaining !== null && playsRemaining <= 0}
              className={`
                w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-bold text-xs sm:text-sm
                shadow-lg transition-all duration-200 flex items-center justify-center gap-2
                ${
                  playsRemaining !== null && playsRemaining <= 0
                    ? 'bg-gradient-to-br from-gray-600 to-gray-700 cursor-not-allowed opacity-70 text-gray-300'
                    : 'bg-gradient-to-br from-[#82ad4b] to-[#6a8f3d] text-white shadow-[#82ad4b]/30 hover:shadow-xl hover:shadow-[#82ad4b]/50 hover:-translate-y-0.5 active:translate-y-0'
                }
              `}
            >
              {playsRemaining !== null && playsRemaining <= 0 ? (
                <>
                  <span>⏰</span> Try Again Tomorrow
                </>
              ) : (
                <>
                  <span>🎮</span> Play Again
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

DinoGame.displayName = 'DinoGame';

export default DinoGame;
