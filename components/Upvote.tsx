"use client";

import React from "react";
import Image from "next/image";
import { upvoteThread } from "@/lib/actions/thread.actions";
import { toast } from "sonner";
interface upvoteProps {
  id: string;
  currentUserId: string;
  upvoteCount: number;
}

const Upvote = ({ upvoteCount, currentUserId, id }: upvoteProps) => {
  const handleUpvote = async () => {
    const result = await upvoteThread(id, currentUserId);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };
  return (
    <div>
      <div
        className="flex items-center justify-center gap-1  "
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
          style={{ color: upvoteCount > 0 ? "red" : "transparent" }}
          className="cursor-pointer object-contain"
        />
        <p className="text-white text-center text-small-regular font-sans">
          {upvoteCount || 0}
        </p>
      </div>
    </div>
  );
};

export default Upvote;
