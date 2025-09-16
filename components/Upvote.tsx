"use client";

import React, { useState } from "react";
import Image from "next/image";
import { upvoteThread } from "@/lib/actions/thread.actions";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface UpvoteProps {
  id: string;
  currentUserId: string;
  upvoteCount: number;
}

const Upvote = ({ upvoteCount: initialCount, currentUserId, id }: UpvoteProps) => {
  const [upvoteCount, setUpvoteCount] = useState(initialCount);

  const handleUpvote = async () => {
    const result = await upvoteThread(id, currentUserId);
    if (result.success) {
      // Update local state to trigger animation
      setUpvoteCount((prev) => prev + 1);
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div>
      <div
        className="flex items-center justify-center gap-1"
        onClick={handleUpvote}
      >
        <Image
          src={upvoteCount > 0 ? "/assets/heart-filled.svg" : "/assets/heart-gray.svg"}
          alt="heart"
          width={24}
          height={24}
          className="cursor-pointer object-contain"
        />
        <AnimatePresence mode="popLayout">
          <motion.div
            key={upvoteCount} 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-lg font-normal text-white"
          >
            {upvoteCount}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Upvote;
