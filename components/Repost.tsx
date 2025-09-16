"use client";

import React, { useState } from "react";
import Image from "next/image";
import { repostThread } from "@/lib/actions/thread.actions";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useOrganization } from "@clerk/nextjs";

interface RepostProps {
  id: string;
  currentUserId: string;
  //   upvoteCount: number;
}

const Repost = ({ currentUserId, id }: RepostProps) => {
  const { organization } = useOrganization();
  //   const [upvoteCount, setUpvoteCount] = useState(initialCount);

  const handleRespost = async () => {
    const result = await repostThread(id, currentUserId, organization?.id);
    if (result.success) {
      // Update local state to trigger animation
      //   setUpvoteCount((prev) => prev + 1);
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div>
      <div
        className="flex items-center justify-center gap-1"
        onClick={handleRespost}
      >
        <Image
          src={"/assets/repost.svg"}
          alt="heart"
          width={24}
          height={24}
          className="cursor-pointer object-contain"
        />
        {/* <AnimatePresence mode="popLayout">
          <motion.div
            key={upvoteCount} 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-md font-extralight text-white"
          >
            {upvoteCount>=1000?(upvoteCount/1000).toFixed(1)+'K':upvoteCount}
          </motion.div>
        </AnimatePresence> */}
      </div>
    </div>
  );
};

export default Repost;
