import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BottomNav from "../components/boost/BottomNav";
import { Crown, Trophy, Star, Medal, Award, Users } from 'lucide-react';
import trophy from "../assets/img/trophy.png";

function Leaderboard() {
  const [activeTab, setActiveTab] = useState('rewards');
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint = activeTab === 'rewards'
          ? 'https://manage.iamdino.org/api/leaderboard/rewards'
          : 'https://manage.iamdino.org/api/leaderboard/holders';
          console.log("Fetching from:", endpoint);
        const res = await axios.get(endpoint);
        const wallets = res.data.wallets || [];

        const formatted = wallets.map((wallet, index) => ({
          rank: index + 1,
          name: wallet.walletAddress,
          rewards: wallet.totalReward.toFixed(3),
          holdings: wallet.totalHoldings || 0,
          level: "1",
        }));
        setLeaders(formatted);
      } catch (err) {
        console.error("❌ Error fetching leaderboard:", err);
      }
    };
    fetchData();
  }, [activeTab]);

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return "from-yellow-400 to-amber-300 border-yellow-400/40";
      case 2: return "from-gray-400 to-gray-300 border-gray-400/40";
      case 3: return "from-amber-600 to-amber-500 border-amber-600/40";
      default: return "from-gray-800 to-gray-700 border-gray-700/40";
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-600" />;
      case 2: return <Trophy className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <Star className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen max-w-sm mx-auto bg-gradient-to-br from-[#0B0C0E] via-[#0E0F11] to-black text-white pb-20">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="relative flex flex-col items-center z-10 text-center pt-8 pb-6 px-4">
        <img
  src={trophy}
  alt="trophy"
  className="w-28 drop-shadow-[0_0_15px_rgba(130,173,75,0.6)]"
/>

          <h1 className="text-3xl font-black tracking-[0.08em] mt-3 bg-gradient-to-r from-[#a8d86c] to-[#82ad4b] bg-clip-text text-transparent">
            Leaderboard
          </h1>
        </div>
      </div>

      {/* Toggle */}
      <div className="px-4 mt-4">
        <div className="bg-[#1a1d17] border border-[#82ad4b]/30 rounded-2xl p-1 max-w-md mx-auto grid grid-cols-2 gap-1 shadow-[0_0_10px_rgba(130,173,75,0.15)]">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all ${activeTab === 'rewards'
              ? 'bg-gradient-to-r from-[#a8d86c] to-[#82ad4b] text-black shadow-[0_0_16px_rgba(130,173,75,0.45)]'
              : 'text-gray-300 hover:text-white hover:bg-[#82ad4b]/10'}`}
          >
            <Award className="h-4 w-4" />
            <span className="font-semibold">Rewards</span>
          </button>
          <button
            onClick={() => setActiveTab('holders')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all ${activeTab === 'holders'
              ? 'bg-gradient-to-r from-[#a8d86c] to-[#82ad4b] text-black shadow-[0_0_16px_rgba(130,173,75,0.45)]'
              : 'text-gray-300 hover:text-white hover:bg-[#82ad4b]/10'}`}
          >
            <Users className="h-4 w-4" />
            <span className="font-semibold">Holders</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="px-4 mt-6 space-y-3">
        {leaders.map((leader) => (
          <div key={leader.rank} className={`relative overflow-hidden rounded-2xl border bg-gradient-to-r ${getRankColor(leader.rank)} p-0.5 shadow-[0_0_14px_rgba(130,173,75,0.15)]`}>
            <div className="bg-gradient-to-br from-[#121614] to-[#0B0D0A] rounded-[15px] p-4 flex items-center justify-between border border-[#82ad4b]/15">
              <div className="flex items-center gap-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${getRankColor(leader.rank)}`}>
                  {getRankIcon(leader.rank)}
                  <span className="absolute text-black font-bold text-sm">{leader.rank}</span>
                </div>
                <div>
                  <div className="font-semibold text-white text-lg">
                    {leader.name.slice(0, 6)}...{leader.name.slice(-4)}
                  </div>
                  <div className="inline-flex gap-1 mt-1 items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-[#82ad4b]/20 to-[#a8d86c]/20 text-[#d7efb8] border border-[#82ad4b]/35">
                    <Star className="h-4 w-4 text-[#82ad4b]" /> Level {leader.level}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {activeTab === 'rewards' ? leader.rewards : leader.holdings}
                </div>
                <div className="text-[#cfe6a8] text-sm">
                  {activeTab === 'rewards' ? 'BCX Rewards' : 'BCX Holdings'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}

export default Leaderboard;