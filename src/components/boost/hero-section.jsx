"use client"

import { useRef } from "react"
import slider1 from '../../assets/img/home/slider-1.webp'
import DinoVideo from "/dino-video.mp4?url"
import { Link } from "react-router-dom"

export function Hero() {
  const scrollerRef = useRef(null)

  function scrollByAmount(amount) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: amount, behavior: "smooth" })
  }

  return (
    <section aria-label="Mining hero" className="mt-3 relative">
  <div className="w-full rounded-2xl overflow-hidden border border-white/5">
    <video
      src={DinoVideo}
      autoPlay
      loop
      muted
      playsInline
      className="w-full h-[200px] object-cover"
    />
    <div className="absolute inset-0 flex flex-col items-start justify-end p-6 bg-gradient-to-t from-black/60 to-transparent">
      
      <Link
        to="/dino"
        className="mt-4 inline-flex z-30 items-center gap-2 rounded-md px-6 py-2 text-sm font-semibold"
        style={{ background: '#82ad4b', color: '#080808' }}
      >
        Play
      </Link>
    </div>
  </div>
</section>

  )
}
