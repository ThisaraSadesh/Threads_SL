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

const Upvote = ({
  upvoteCount: initialCount,
  currentUserId,
  id,
}: UpvoteProps) => {
  const [upvoteCount, setUpvoteCount] = useState(initialCount);

  const handleUpvote = async () => {
    setUpvoteCount((prev) => prev + 1);

    const result = await upvoteThread(id, currentUserId);
    if (result.success) {
      toast.success(result.message);
    } else {
      setUpvoteCount((prev) => prev - 1);

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
          src={
            upvoteCount > 0
              ? "/assets/heart-filled.svg"
              : "/assets/heart-gray.svg"
          }
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
            className="text-md font-extralight text-white"
          >
            {upvoteCount >= 1000
              ? (upvoteCount / 1000).toFixed(1) + "K"
              : upvoteCount}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Upvote;
