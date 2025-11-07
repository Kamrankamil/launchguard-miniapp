import React, { useState, useEffect } from "react";
import axios from "axios";
import BottomNav from "../components/boost/BottomNav";
import { Gift, Copy } from "lucide-react";
import InviteModal from "../components/global/InviteModal";
import toast from "react-hot-toast";

const API_BASE = "https://manage.iamdino.org";
const NGROK_BASE = "https://manage.iamdino.org";

function Friends() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [referralData, setReferralData] = useState({
    totalReward: 0,
    friendsReferred: 0,
  });

  // Get Telegram user data
  useEffect(() => {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser) {
      setUser(tgUser);
      fetchUserData(tgUser.id.toString());
    }
  }, []);

  // Handle referral join when user opens app with referral code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referrerTelegramId = params.get("ref");
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

    if (referrerTelegramId && tgUser) {
      const joinedKey = `joined_${tgUser.id}`;
      const alreadyJoined = localStorage.getItem(joinedKey);

      if (!alreadyJoined) {
        console.log('🔗 Processing referral join:', { referrerTelegramId, userId: tgUser.id });
        
        axios
          .post(`${API_BASE}/api/referral-join`, {
            referrerTelegramId,
            telegramId: tgUser.id.toString(),
            telegramFirstName: tgUser.first_name,
            telegramLastName: tgUser.last_name,
            telegramUsername: tgUser.username,
            telegramPhotoUrl: tgUser.photo_url,
          })
          .then((res) => {
            if (res.data.success) {
              localStorage.setItem(joinedKey, 'true');
              toast.success(`Welcome! You've joined via ${referrerTelegramId}'s referral!`);
              fetchUserData(tgUser.id.toString());
            } else {
              console.log('Referral join response:', res.data.error);
              if (res.data.error !== "Already joined") {
                toast.error(res.data.error);
              }
            }
          })
          .catch((err) => {
            console.error("Referral join error:", err);
            toast.error("Error joining referral");
          });
      }
    }
  }, []);

  const fetchUserData = async (telegramId) => {
    try {
      const res = await axios.get(`${API_BASE}/api/referral-stats/${telegramId}`);
      if (res.data.success) {
        setReferralData(res.data);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  const referralLink = user
    ? `https://t.me/LaunchGuardBot/app?startapp=ref_${user.id}`
    : "Loading...";

  const handleCopy = async () => {
    if (!user) return toast.error("Please wait for user data to load");
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Referral link copied!");
    } catch (err) {
      console.warn("Clipboard blocked, using fallback:", err);
      const textArea = document.createElement("textarea");
      textArea.value = referralLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Referral link copied!");
    }
  };

  const handleShare = () => {
    if (!user) return toast.error("Please wait for user data to load");
    
    const shareText = `Join me on LaunchGuard and earn IMDINO tokens! 🚀`;
    const shareUrl = referralLink;

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
      );
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-black flex flex-col justify-between text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0e0f11] via-black to-black" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#82ad4b]/15 blur-[120px] rounded-full" />

      <div className="relative px-6 pt-10 pb-32">
        <h1 className="text-3xl font-semibold text-center mb-8 tracking-wide">
          Build your network
        </h1>

        {/* Reward Box */}
        <div className="bg-[#82ad4b]/10 backdrop-blur-md border border-[#82ad4b]/40 rounded-2xl p-5 flex items-center justify-between mb-10 shadow-[0_0_25px_rgba(130,173,75,0.35)]">
          <div>
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-[#a8d86c] to-[#82ad4b] font-semibold text-lg">
              Earn IMDINO for every
            </p>
            <p className="text-gray-300 text-sm">Friends join, and rule the jungle!</p>
          </div>
          <div className="bg-gradient-to-br from-[#a8d86c] to-[#82ad4b] p-3 rounded-xl shadow-[0_0_20px_rgba(130,173,75,0.55)]">
            <Gift className="text-black w-7 h-7" />
          </div>
        </div>

        {/* Referral link */}
        {/* <div className="mt-10 bg-white/5 p-4 rounded-xl flex items-center justify-between border border-white/20">
          <span className="truncate text-gray-300 text-xs">{referralLink}</span>
          <button onClick={handleCopy}>
            <Copy className="w-5 h-5 text-white" />
          </button>
        </div> */}

        <div className="mt-8">
          <button
            onClick={() => setOpen(true)}
            className="w-full bg-gradient-to-r from-[#a8d86c] to-[#82ad4b] text-black font-semibold py-3 rounded-lg shadow-[0_0_22px_rgba(130,173,75,0.55)] hover:scale-[1.02] transition-transform"
          >
            + Invite a friend
          </button>
        </div>

        {/* Earnings */}
        <div className="mt-14 space-y-8">
          <div className="bg-[#82ad4b]/10 border border-[#82ad4b]/35 rounded-2xl p-5 shadow-[0_0_20px_rgba(130,173,75,0.35)]">
            <h2 className="text-lg font-semibold mb-4 text-white">
              Referral Earnings
            </h2>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#cfe6a8]">Total Earned</p>
              <p className="text-transparent bg-clip-text bg-gradient-to-r from-[#a8d86c] to-[#82ad4b] font-bold">
                {referralData.totalReward.toFixed(2)} IMDINO
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[#cfe6a8]">Friends Referred</p>
              <p className="text-transparent bg-clip-text bg-gradient-to-r from-[#a8d86c] to-[#82ad4b] font-bold">
                {referralData.friendsReferred}
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
      <InviteModal 
        open={open} 
        onClose={() => setOpen(false)} 
        referralLink={referralLink}
        onShare={handleShare}
      />
    </div>
  );
}

export default Friends;