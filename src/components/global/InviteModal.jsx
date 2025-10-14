"use client"

import { FaShare } from "react-icons/fa"
import { IoCopy } from "react-icons/io5"
import { motion, AnimatePresence } from "framer-motion"

export default function InviteModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="relative w-full max-w-md rounded-3xl border border-gray-800/60 
              bg-gradient-to-br from-[#0B0C0E] via-[#121316] to-[#0E0F11] 
              p-6 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
          >
            {/* Top handle */}
            <div className="h-1.5 w-12 rounded-full bg-gray-600 mx-auto mb-6" />

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-100 tracking-wide">
                Invite Friends
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Choose how you’d like to invite your friend
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-3 w-full py-4 
                  rounded-xl font-semibold text-black 
                  bg-gradient-to-r from-yellow-400 to-yellow-300
                  shadow-[0_0_20px_#facc15aa] hover:shadow-[0_0_30px_#facc15cc] 
                  transition-all"
              >
                <FaShare className="text-black" />
                Send Invite
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-3 w-full py-4 
                  rounded-xl font-semibold text-black 
                  bg-gradient-to-r from-yellow-400 to-yellow-300
                  shadow-[0_0_20px_#facc15aa] hover:shadow-[0_0_30px_#facc15cc]
                  transition-all"
              >
                <IoCopy className="text-black" />
                Copy Link
              </motion.button>
            </div>

            {/* Footer */}
            <button
              onClick={onClose}
              className="mt-6 w-full text-center text-gray-500 text-sm hover:text-gray-300 transition"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
