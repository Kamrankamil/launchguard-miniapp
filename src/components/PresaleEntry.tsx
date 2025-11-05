import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import buycexlogo from '../assets/img/BUYCEX-INFINITY.png';
import Dino from '../../public/dino-2.gif';

const BACKEND_URL =
  import.meta.env.x || 'https://isochronous-packable-sherly.ngrok-free.dev';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
  is_premium?: boolean;
  allows_write_to_pm?: boolean;
}

const PresaleEntry: React.FC = () => {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Checking Telegram connection...');
  const [validationStatus, setValidationStatus] =
    useState<'pending' | 'validated' | 'fallback'>('pending');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🚀 Checking Telegram SDK...');
    let checkCount = 0;
    const maxChecks = 40; // ~20 seconds (40×500ms)

    const checkTelegram = async () => {
      checkCount++;
      const tg = (window as any).Telegram?.WebApp;

      if (tg) {
        console.log('✅ Telegram SDK found');
        console.log('📊 Full Telegram WebApp object:', tg);
        console.log('📊 initData:', tg.initData);
        console.log('📊 initDataUnsafe:', tg.initDataUnsafe);
        
        const user = tg.initDataUnsafe?.user;

        if (user?.id) {
          console.log('✅ Telegram user:', user.first_name, user.id);
          setTelegramUser(user);
          setLoadingMessage('Verifying your account...');

          const initDataRaw = tg.initData;
          console.log('📤 Sending initData to backend:', initDataRaw ? 'Available' : 'Missing');
          console.log('📤 initData length:', initDataRaw?.length || 0);

          // Save user and then redirect
          if (initDataRaw && initDataRaw.trim().length > 0) {
            // start server validation
            console.log('🔐 Attempting validated login...');
            await saveTelegramUserValidated(initDataRaw, user);
          } else {
            console.log('⚠️ No initData, using mobile fallback');
            // fallback mobile save
            await saveTelegramUserMobile(user);
          }

          // Show success state briefly before redirect
          setLoadingMessage('Success! Launching game...');
          setIsRedirecting(true);
          
          // Navigate after brief delay
          setTimeout(() => {
            console.log('🚀 Navigating to /boost...');
            try {
              navigate('/boost');
            } catch (err) {
              console.warn('Navigation to /boost failed', err);
            }
          }, 1000);
        } else {
          // No user data found, redirect to landing
          console.log('⚠️ No Telegram user data found. Redirecting to landing...');
          setLoadingMessage('Redirecting to homepage...');
          setTimeout(() => navigate('/landing#home'), 1000);
        }
      } else if (checkCount < maxChecks) {
        if (checkCount % 4 === 0) {
          setLoadingMessage(`Connecting${'.'.repeat((checkCount / 4) % 4)}`);
        }
        setTimeout(checkTelegram, 500);
      } else {
        // Telegram SDK not loaded, redirect to landing
        console.log('❌ Telegram SDK not loaded. Redirecting to landing page...');
        setLoadingMessage('Opening web version...');
        setTimeout(() => navigate('/landing#home'), 1000);
      }
    };

    setTimeout(checkTelegram, 1000);
  }, [navigate]);

  const saveTelegramUserValidated = async (initDataRaw: string, user: TelegramUser) => {
    try {
      console.log('🔐 Validating Telegram user...');
      console.log('📤 Sending initData (first 100 chars):', initDataRaw.substring(0, 100));
      const response = await axios.post(
        `${BACKEND_URL}/api/telegram-login`,
        { initData: initDataRaw }, // backend expects "initData" not "initDataRaw"
        {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': '69420',
          },
          timeout: 10000,
        }
      );
      console.log('✅ Telegram user validated:', response.data);
      setValidationStatus('validated');
    } catch (error: any) {
      console.error('❌ Validation failed:', error.response?.data || error.message);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Full error:', error);
      setValidationStatus('fallback');
      console.log('🔄 Switching to mobile fallback save...');
      saveTelegramUserMobile(user);
    }
  };

  const saveTelegramUserMobile = async (user: TelegramUser) => {
    try {
      console.log('📱 Saving Telegram user (fallback)...');
      const response = await axios.post(
        `${BACKEND_URL}/api/telegram-login-mobile`,
        { telegramUser: user },
        {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': '69420',
          },
          timeout: 10000,
        }
      );
      console.log('✅ Telegram user saved:', response.data);
    } catch (error: any) {
      console.error('❌ Save failed:', error.response?.data || error.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black text-white p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
      

        {/* Main Card */}
        <div className="rounded-lg border border-white/30 bg-black/60 p-6 text-center backdrop-blur-lg shadow-2xl shadow-white/20">
          {/* Dino Animation */}
          <div className="mb-6">
            <img 
              src={Dino} 
              alt="Dino" 
              className={`w-40 h-44 mx-auto ${!telegramUser ? 'animate-bounce' : ''}`} 
            />
          </div>

          {/* Loading/User State */}
          {!telegramUser ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse delay-200"></div>
              </div>
              <p className="text-xl text-yellow-300 font-semibold">{loadingMessage}</p>
              <p className="text-sm text-gray-400">Please wait while we connect to Telegram...</p>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              {/* User Info Card */}
              <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-lg">
                <div className="flex items-center justify-center gap-4 mb-3">
                  {telegramUser.photo_url ? (
                    <img
                      src={telegramUser.photo_url}
                      alt={telegramUser.first_name}
                      className="w-16 h-16 rounded-full border-3 border-green-400 shadow-lg shadow-green-500/50"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full border-3 border-green-400 bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-green-500/50">
                      {telegramUser.first_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-green-300 font-bold text-lg">
                      {telegramUser.first_name} {telegramUser.last_name || ''}
                    </p>
                    {telegramUser.username && (
                      <p className="text-green-400 text-sm">@{telegramUser.username}</p>
                    )}
                    {telegramUser.is_premium && (
                      <span className="inline-block mt-1 text-xs bg-blue-500/30 text-blue-300 px-2 py-1 rounded-full border border-blue-400/50">
                        ⭐ Premium
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-3 pt-3 border-t border-green-500/30">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <p className="text-green-400 text-sm font-semibold">Connected</p>
                  </div>
                  {validationStatus === 'validated' && (
                    <span className="text-xs bg-green-500/30 text-green-300 px-3 py-1 rounded-full border border-green-400/50">
                      🔐 Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Loading to Game */}
              {isRedirecting && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                  <p className="text-yellow-300 font-semibold text-lg">{loadingMessage}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Text */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Powered by Telegram Mini Apps
        </p>
      </div>
    </div>
  );
};

export default PresaleEntry;