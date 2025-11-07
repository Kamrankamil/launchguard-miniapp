"use client"

import { useState } from "react"
import { Menu, X, ExternalLink, Twitter, MessageCircle, Compass, Gem, Zap, Trophy, Star, Target, Lock, Calendar, CheckCircle, Clock } from "lucide-react"
import Dino from "/dino-2.gif?url"
import Dino2 from "/dino-3.gif?url"
import { Link } from "react-router-dom"
import dinoCoin from "../assets/img/coin-dino.png"
import { RiTelegram2Fill, RiTwitterXFill } from "react-icons/ri"

export default function LandingMini() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userPoints, setUserPoints] = useState(0)
  const [userLevel, setUserLevel] = useState(1)
  const [completedQuests, setCompletedQuests] = useState<string[]>([])
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([])

  const quests = [
    { id: "follow", title: "Follow on X", points: 100, icon: RiTwitterXFill },
    { id: "join-discord", title: "Join telegram", points: 150, icon: RiTelegram2Fill },
    { id: "share", title: "Share with Friends", points: 200, icon: "🔗"  },
    { id: "hold", title: "Play IMDINO", points: 500, icon: dinoCoin },
  ]

  const achievements = [
    {
      id: "first-step",
      title: "First Step",
      desc: "Complete your first quest",
      icon: "👣",
      locked: !unlockedAchievements.includes("first-step"),
    },
    {
      id: "quest-master",
      title: "Quest Master",
      desc: "Complete 3 quests",
      icon: "🎯",
      locked: !unlockedAchievements.includes("quest-master"),
    },
    {
      id: "dino-collector",
      title: "Dino Collector",
      desc: "Earn 1000 points",
      icon: "🦕",
      locked: !unlockedAchievements.includes("dino-collector"),
    },
    {
      id: "legend",
      title: "Legend",
      desc: "Reach Level 5",
      icon: "👑",
      locked: !unlockedAchievements.includes("legend"),
    },
  ]

  const leaderboard = [
    { rank: 1, name: "DinoKing", points: 5420, level: 8 },
    { rank: 2, name: "ReptileRuler", points: 4890, level: 7 },
    { rank: 3, name: "MesozoicMaster", points: 4320, level: 7 },
    { rank: 4, name: "You", points: userPoints, level: userLevel, isUser: true },
    { rank: 5, name: "CryptoSaurus", points: 2150, level: 4 },
  ]

  const roadmapItems = [
    {
      phase: "Phase 1",
      title: "Dino Genesis",
      status: "completed",
      items: [
        "Born From Digital Jungle",
        "Community Building",
        "Website & Social Launch",
        "First 1,000 Holders"
      ]
    },
    {
      phase: "Phase 2",
      title: "Jungle Expansion",
      status: "current",
      items: [
        "Telegram Mini App Launch",
        "Quest & Achievement System",
        "Leaderboard Integration",
        "Community Events"
      ]
    },
    {
      phase: "Phase 3",
      title: "Prehistoric Power",
      status: "upcoming",
      items: [
        "In-Game Token Utility",
        "NFT Dino Collection",
        "Mobile App Development",
        "Partnership Announcements"
      ]
    },
    {
      phase: "Phase 4",
      title: "Dino Dominion",
      status: "future",
      items: [
        "Multi-chain Expansion",
        "Advanced Game Features",
        "Vibe and HODL",
        "Global Tournament System"
      ]
    }
  ]

  const handleCompleteQuest = (questId: string, points: number) => {
    if (!completedQuests.includes(questId)) {
      setCompletedQuests([...completedQuests, questId])
      const newPoints = userPoints + points
      setUserPoints(newPoints)
      const newLevel = Math.floor(newPoints / 1000) + 1
      setUserLevel(newLevel)

      if (completedQuests.length === 0) {
        setUnlockedAchievements([...unlockedAchievements, "first-step"])
      }
      if (completedQuests.length === 2) {
        setUnlockedAchievements([...unlockedAchievements, "quest-master"])
      }
      if (newPoints >= 1000 && !unlockedAchievements.includes("dino-collector")) {
        setUnlockedAchievements([...unlockedAchievements, "dino-collector"])
      }
      if (newLevel >= 5 && !unlockedAchievements.includes("legend")) {
        setUnlockedAchievements([...unlockedAchievements, "legend"])
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={24} className="text-green-400" />
      case "current":
        return <Clock size={24} className="text-yellow-400 animate-pulse" />
      case "upcoming":
        return <Calendar size={24} className="text-blue-400" />
      case "future":
        return <Star size={24} className="text-purple-400" />
      default:
        return <Calendar size={24} className="text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "border-green-400 bg-green-500/10"
      case "current":
        return "border-yellow-400 bg-yellow-500/10"
      case "upcoming":
        return "border-blue-400 bg-blue-500/10"
      case "future":
        return "border-purple-400 bg-purple-500/10"
      default:
        return "border-gray-400 bg-gray-500/10"
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-sm border-b-4 border-green-400">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
          <a href="#home" className="flex items-center gap-1 sm:gap-2">
            <div className="text-2xl sm:text-3xl">🦖</div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-dino font-black text-white" style={{ textShadow: "0 0 10px rgba(34, 197, 94, 0.5)" }}>
              I AM DINO
            </h2>
          </a>

          <div className="hidden md:flex gap-6 lg:gap-8">
            <a href="#quests" className="hover:text-green-300 transition font-bold text-sm lg:text-base">
              QUESTS
            </a>
            <a href="#how-to-play" className="hover:text-green-300 transition font-bold text-sm lg:text-base">
              HOW TO PLAY
            </a>
            <a href="#roadmap" className="hover:text-green-300 transition font-bold text-sm lg:text-base">
              ROADMAP
            </a>
            <a href="#about" className="hover:text-green-300 transition font-bold text-sm lg:text-base">
              ABOUT I AM DINO
            </a>
          </div>

          <Link to="https://t.me/Iamdino_bot" target="_blank" className="hidden md:block px-4 lg:px-6 py-2 border-2 border-green-400 text-white bg-green-500 rounded-lg hover:bg-green-400 hover:text-black transition font-bold shadow-lg shadow-green-500/50 text-sm lg:text-base">
            PLAY NOW
          </Link>

          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black border-t-4 border-green-400 p-4 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-400">Navigation</span>
              <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <a href="#quests" className="block hover:text-green-300 font-bold py-2" onClick={() => setIsMenuOpen(false)}>
              QUESTS
            </a>
            <a href="#how-to-play" className="block hover:text-green-300 font-bold py-2" onClick={() => setIsMenuOpen(false)}>
              HOW TO PLAY
            </a>
            <a href="#roadmap" className="block hover:text-green-300 font-bold py-2">
              ROADMAP
            </a>
            <a href="#about" className="block hover:text-green-300 font-bold py-2" onClick={() => setIsMenuOpen(false)}>
              ABOUT I AM DINO
            </a>
            <a href="https://t.me/Iamdino_bot" target="_blank" className="w-full flex items-center justify-center flex-1 text-center px-6 py-3 border-2 border-green-400 text-white bg-green-500 rounded-lg hover:bg-green-400 hover:text-black transition font-bold mt-4">
              PLAY NOW
            </a>
          </div>
        )}
      </nav>

      <section
      id="home"
        className="pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20 px-3 sm:px-4 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)`,
          backgroundAttachment: "fixed",
        }}
      >
        {/* Jungle background elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {/* Sky */}
          <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-blue-900/20 to-transparent"></div>

          {/* Mountains */}
          <svg
            className="absolute bottom-0 left-0 w-full h-48 sm:h-64 opacity-30"
            viewBox="0 0 1200 300"
            preserveAspectRatio="none"
          >
            <polygon
              points="0,200 150,80 300,150 450,60 600,140 750,70 900,160 1050,90 1200,180 1200,300 0,300"
              fill="#22c55e"
              opacity="0.3"
            />
            <polygon
              points="0,220 180,100 360,170 540,80 720,160 900,90 1080,200 1200,220 1200,300 0,300"
              fill="#16a34a"
              opacity="0.2"
            />
          </svg>

          {/* Clouds */}
          <div className="absolute top-16 sm:top-20 left-4 sm:left-10 w-24 sm:w-32 h-12 sm:h-16 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          <div
            className="absolute top-32 sm:top-40 right-8 sm:right-20 w-32 sm:w-40 h-16 sm:h-20 bg-white/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 sm:gap-12 items-center relative z-10">
          {/* Left Content */}
          <div className="space-y-6 sm:space-y-8 text-center md:text-left">
            <div className="space-y-3 sm:space-y-4">
              <h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight"
                style={{ textShadow: "0 0 10px rgba(34,197,94,0.5)", fontFamily: "var(--font-heading)" }}
              >
                I AM DINO
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-green-300 font-bold">Welcome to the Digital Jungle</p>
            </div>

            <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
              Where chaos meets creativity and memes rule the ecosystem. Born for trade and fun. Built for the Telegram
              Mini App generation, Dino isn't just a coin—he's a living, roaring symbol of the new-age Web3 culture.
            </p>

            <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
              In this jungle, logic takes a backseat — fun earns you coins, memes build empires, and every roar echoes
              across the blockchain. Complete quests, earn points, level up, and unlock exclusive achievements!
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
              <button onClick={() => window.open("https://t.me/Iamdino_bot", "_blank")} className="px-6 sm:px-8 py-3 sm:py-4 bg-green-500 text-black font-black rounded-lg hover:bg-green-400 transition transform hover:scale-105 text-base sm:text-lg shadow-lg shadow-green-500/60 border-2 border-green-400">
                START PLAYING
              </button>
            </div>
          </div>

          {/* Right - Pixel Art Dino Character */}
          <div className="flex justify-center items-center order-first md:order-last">
            <div className="relative w-full h-64 sm:h-80 md:h-96 flex items-center justify-center">
              <img src={Dino} alt="Loading..." className="w-40 sm:w-48 md:w-80 h-56 sm:h-64 md:h-96 transform -scale-x-100" />
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-transparent rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 sm:gap-12 items-start md:items-center">
          <div className="order-2 md:order-1 flex justify-center md:justify-start">
            <img
              src={Dino2}
              alt="Loading..."
              className="w-72 md:w-96 h-56 md:h-72"
            />

          </div>
          <div className="space-y-4 sm:space-y-6 order-1 md:order-2 text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white" style={{ textShadow: "0 0 10px rgba(34,197,94,0.5)", fontFamily: "var(--font-heading)" }}>
              ABOUT I AM DINO
            </h2>
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
              Hatched from the blockchain jungle — born for trade and fun. I Am Dino ($IMDINO) is the social meme layer
              of Web3, connecting gamers, creators, and communities through play-to-earn mini adventures, viral
              storytelling, and unstoppable Dino spirit.
            </p>
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
              Fueled by players. Powered by community. In this jungle, logic takes a backseat — fun earns you coins,
              memes build empires, and every roar echoes across the blockchain.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-1 space-y-2 sm:space-y-3 pt-2 sm:pt-4">
              <div className="flex items-center gap-2 sm:gap-3 justify-center md:justify-start">
                <span className="text-green-300 text-xl sm:text-2xl font-black">✓</span>
                <span className="text-gray-300 font-bold text-sm sm:text-base">Zero transaction taxes</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 justify-center md:justify-start">
                <span className="text-green-300 text-xl sm:text-2xl font-black">✓</span>
                <span className="text-gray-300 font-bold text-sm sm:text-base">Fair launch, no presale</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 justify-center md:justify-start">
                <span className="text-green-300 text-xl sm:text-2xl font-black">✓</span>
                <span className="text-gray-300 font-bold text-sm sm:text-base">Gamified rewards system</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 justify-center md:justify-start">
                <span className="text-green-300 text-xl sm:text-2xl font-black">✓</span>
                <span className="text-gray-300 font-bold text-sm sm:text-base">Telegram Mini App ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Calendar size={24} className="text-green-300 sm:w-8 sm:h-8 hidden md:block" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white text-center md:text-left mx-auto md:mx-0" style={{ textShadow: "0 0 10px rgba(34,197,94,0.5)", fontFamily: "var(--font-heading)" }}>
              DINO JUNGLEMAP
            </h2>
          </div>
          <p className="text-sm sm:text-base text-gray-300 mb-8 sm:mb-12 font-bold text-center sm:text-left">Witness the evolution of I AM DINO from hatchling to apex predator!</p>

          <div className="relative">
            {/* Timeline line - hidden on mobile, visible on desktop */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-2 bg-green-400/30 rounded-full"></div>

            <div className="space-y-8 sm:space-y-12">
              {roadmapItems.map((phase, index) => (
                <div key={phase.phase} className="relative">
                  {/* Mobile: Simple vertical layout */}
                  <div className="md:hidden">
                    <div className="flex items-start gap-4">
                      {/* Mobile timeline node */}
                      <div className="w-6 h-6 rounded-full hidden md:flex bg-green-500 border-2 border-black flex-shrink-0 mt-1"></div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className={`p-4 sm:p-6 border-4 rounded-lg ${getStatusColor(phase.status)} transition`}>
                          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            {getStatusIcon(phase.status)}
                            <div>
                              <span className="text-xs sm:text-sm font-black text-green-300 uppercase tracking-wide">{phase.phase}</span>
                              <h3 className="text-lg sm:text-xl font-black text-white">{phase.title}</h3>
                            </div>
                          </div>
                          <ul className="space-y-1 sm:space-y-2">
                            {phase.items.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex items-start gap-2 text-gray-300 font-bold text-sm sm:text-base">
                                <span className="text-green-400 mt-1">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-3 sm:mt-4 flex items-center gap-2">
                            <div className={`px-2 py-1 rounded text-xs font-black ${phase.status === 'completed' ? 'bg-green-500 text-black' :
                              phase.status === 'current' ? 'bg-yellow-500 text-black' :
                                phase.status === 'upcoming' ? 'bg-blue-500 text-white' :
                                  'bg-purple-500 text-white'
                              }`}>
                              {phase.status.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop: Alternating layout */}
                  <div className={`hidden md:flex ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} items-center`}>
                    {/* Timeline node */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-green-500 border-4 border-black z-10"></div>

                    {/* Content */}
                    <div className={`w-5/12 ${index % 2 === 0 ? 'pr-12' : 'pl-12'}`}>
                      <div className={`p-6 border-4 rounded-lg ${getStatusColor(phase.status)} transition hover:scale-105`}>
                        <div className="flex items-center gap-3 mb-4">
                          {getStatusIcon(phase.status)}
                          <div>
                            <span className="text-sm font-black text-green-300 uppercase tracking-wide">{phase.phase}</span>
                            <h3 className="text-2xl font-black text-white">{phase.title}</h3>
                          </div>
                        </div>
                        <ul className="space-y-2">
                          {phase.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-center gap-2 text-gray-300 font-bold">
                              <span className="text-green-400">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 flex items-center gap-2">
                          <div className={`px-2 py-1 rounded text-xs font-black ${phase.status === 'completed' ? 'bg-green-500 text-black' :
                            phase.status === 'current' ? 'bg-yellow-500 text-black' :
                              phase.status === 'upcoming' ? 'bg-blue-500 text-white' :
                                'bg-purple-500 text-white'
                            }`}>
                            {phase.status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Daily Quests Section */}
      <section id="quests" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-green-500/10 border-y-4 border-green-400">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Target size={24} className="text-green-300 sm:w-8 sm:h-8 hidden md:block" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white text-center md:text-left mx-auto md:mx-0" style={{ textShadow: "0 0 10px rgba(34,197,94,0.5)", fontFamily: "var(--font-heading)" }}>
              DAILY QUESTS
            </h2>
          </div>
          <p className="text-sm sm:text-base text-gray-300 mb-8 sm:mb-12 font-bold text-center sm:text-left">Complete quests to earn points and level up!</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {quests.map((quest) => {
              const isCompleted = completedQuests.includes(quest.id)
              return (
                <div
                  key={quest.id}
                  className={`p-4 sm:p-6 border-4 rounded-lg transition ${isCompleted
                    ? "bg-green-500/30 border-green-400"
                    : "bg-black border-green-400 hover:border-green-300"
                    }`}
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="text-3xl sm:text-4xl">
                      {typeof quest.icon === "string" ? (
                        (quest.icon as string).includes(".png") ? (
                          <img src={quest.icon as string} alt="quest" className="w-8 h-8 sm:w-10 sm:h-10" />
                        ) : (
                          <span>{quest.icon}</span>
                        )
                      ) : (
                        (() => {
                          const IconComp = quest.icon as React.ComponentType<{ className?: string }>
                          return <IconComp className="w-8 h-8 sm:w-10 sm:h-10" />
                        })()
                      )}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-green-500/40 border-2 border-green-400 rounded-lg">
                      <Zap size={14} className="text-green-300 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm font-black text-green-300">+{quest.points}</span>
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mb-3 sm:mb-4">{quest.title}</h3>
                  <button
                    onClick={() => window.open("https://t.me/Iamdino_bot", "_blank")}
                    className={`w-full py-2 sm:py-3 rounded-lg font-black transition border-2 text-sm sm:text-base ${isCompleted
                      ? "bg-green-500/30 text-green-300 border-green-400 cursor-default"
                      : "bg-green-500 text-black hover:bg-green-400 border-green-400"
                      }`}
                  >
                    COMPLETE QUEST
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How to Play Section */}
      <section id="how-to-play" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-black border-y-4 border-green-400">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Zap size={28} className="text-green-300 sm:w-8 sm:h-8 hidden md:block" />
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-black text-white text-center md:text-left mx-auto md:mx-0"
              style={{
                textShadow: "0 0 10px rgba(34,197,94,0.5)",
                fontFamily: "var(--font-heading)",
              }}
            >
              HOW TO PLAY
            </h2>
          </div>
          <p className="text-sm sm:text-base text-gray-300 mb-8 sm:mb-12 font-bold text-center sm:text-left">
            Follow these simple steps to become the ultimate Dino explorer!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="p-6 border-4 border-green-400 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition text-center">
              <Compass size={48} className="text-green-300 mx-auto mb-4" />
              <h3 className="text-xl font-black text-white mb-2">1. Join the Jungle</h3>
              <p className="text-gray-300 text-sm font-bold">
                Connect to the Telegram Mini App and enter the Dino ecosystem.
              </p>
            </div>

            <div className="p-6 border-4 border-green-400 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition text-center">
              <Target size={40} className="text-green-300 mx-auto mb-4" />
              <h3 className="text-xl font-black text-white mb-2">2. Complete Games & Quests</h3>
              <p className="text-gray-300 text-sm font-bold">
                Finish daily tasks like sharing, following, or playing games.
              </p>
            </div>

            <div className="p-6 border-4 border-green-400 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition text-center">
              <Gem size={40} className="text-green-300 mx-auto mb-4" />
              <h3 className="text-xl font-black text-white mb-2">3. Earn Coins</h3>
              <p className="text-gray-300 text-sm font-bold">
                Claim IMDINO coins by completing games and quests.
              </p>
            </div>

          </div>

          <div className="text-center mt-10">
            <button onClick={() => window.open("https://t.me/Iamdino_bot", "_blank")} className="px-8 py-4 bg-green-500 text-black font-black rounded-lg hover:bg-green-400 transition transform hover:scale-105 text-lg shadow-lg shadow-green-500/60 border-2 border-green-400">
              START YOUR JOURNEY
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-green-500/10 border-y-4 border-green-400">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white"
            style={{ textShadow: "0 0 10px rgba(34,197,94,0.5)", fontFamily: "var(--font-heading)" }}
          >
            Ready to Join the Herd?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 font-bold px-2">
            Start earning points, unlock achievements, and compete on the leaderboard today!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button onClick={() => window.open("https://t.me/Iamdino_bot", "_blank")} className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-green-500 text-black font-black rounded-lg hover:bg-green-400 transition transform hover:scale-105 text-base sm:text-lg shadow-lg shadow-green-500/60 border-2 border-green-400">
              PLAY NOW
            </button>
            <button onClick={() => window.open("https://t.me/imdinocoin", "_blank")} className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 border-4 border-green-400 text-green-300 font-black rounded-lg hover:bg-green-500/20 transition text-base sm:text-lg">
              JOIN TELEGRAM
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-green-400 py-8 sm:py-12 px-3 sm:px-4 bg-black/80">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">🦖</span>
                <span className="font-black text-white text-lg sm:text-xl">I AM DINO</span>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                The gamified prehistoric meme coin for the modern era. Fueled by players. Powered by community.
              </p>
            </div>
            <div>
              <h4 className="font-black text-white mb-3 sm:mb-4 text-sm sm:text-base">LINKS</h4>
              <ul className="space-y-1 sm:space-y-2 text-gray-400 text-xs sm:text-sm">
                <li>
                  <a href="https://x.com/imdinocoin?s=21" className="hover:text-green-300 transition font-bold">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="https://t.me/imdinocoin" className="hover:text-green-300 transition font-bold">
                    Telegram
                  </a>
                </li>
                <li>
                  <a href="https://t.me/iamdinocoin" className="hover:text-green-300 transition font-bold">
                  Telegram Channel
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-white mb-3 sm:mb-4 text-sm sm:text-base">RESOURCES</h4>
              <ul className="space-y-1 sm:space-y-2 text-gray-400 text-xs sm:text-sm">
                <li>
                  <a href="#" className="hover:text-green-300 transition font-bold">
                  The Jungle Paper
                  </a>
                </li>
               
              </ul>
            </div>
          </div>
          <div className="border-t-2 border-green-400 pt-6 sm:pt-8 text-center text-gray-400 text-xs sm:text-sm">
            <p className="font-bold">© 2025 I AM DINO. All rights reserved. Roaring across the blockchain!</p>
          </div>
        </div>
      </footer>
    </div>
  )
}