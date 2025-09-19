// components/cards/ThreadCard.tsx
"use client";

import { formatDateString } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import Upvote from "../Upvote";
import { Suspense, useState } from "react";
import Repost from "../Repost";
import { ObjectId } from "mongoose";
import { ProfileImage } from "../shared/ProfileImage";
import PostThread from "../../components/forms/PostThread";

// ⚠️ Remove this unless you’re actually using PPR — it’s experimental and can cause issues
// export const experimental_ppr = true;

// ✅ Define clear, reusable types
interface Author {
  name: string;
  image: string;
  id: string;
}

interface Community {
  id: string;
  name: string;
  image: string;
}

interface OriginalPost {
  id: string;
  createdAt: string | Date;
  author: Author;
}

interface Props {
  id: string;
  currentUserId: string;
  parentId: string;
  content: string;
  images: string[];
  author: Author;
  community: Community | null;
  createdAt: string; // ISO string expected
  comments: Array<{ author: { image: string } }>;
  isComment?: boolean;
  upvoteCount: number;
  isShared?: boolean;
  SharedBy?: Author[]; // Fixed: was tuple type `[{}]`, should be array
  userIdfromDB?: ObjectId;
  originalCommunity?: Community;
  originalPost?: OriginalPost;
}

const ThreadCard = ({
  id,
  currentUserId,
  parentId,
  content,
  images = [],
  author,
  community,
  createdAt,
  comments = [],
  isComment = false,
  upvoteCount = 0,
  isShared = false,
  SharedBy,
  userIdfromDB,
  originalCommunity,
  originalPost,
}: Props) => {
  const [isEditing, setIsEditing] = useState(false);

  // 💡 Helper to safely get display date
  const getDisplayDate = () => {
    if (isShared && originalPost?.createdAt) {
      return formatDateString(originalPost.createdAt);
    }
    return formatDateString(createdAt);
  };

  // 💡 Helper to safely get display community
  const getDisplayCommunity = () => {
    if (isShared && originalCommunity) return originalCommunity;
    return community;
  };

  // 💡 Helper to safely get display author (for header)
  const getDisplayAuthor = () => {
    if (isShared && originalPost?.author) return originalPost.author;
    return author;
  };

  return !isEditing ? (
    <article
      className={`flex w-full flex-col rounded-xl ${
        isComment ? "px-0 xs:px-7" : "bg-dark-2 p-7"
      }`}
    >
      <div className="flex gap-3 w-full">
        {/* Show original author avatar only if not shared */}
        {!isShared && <ProfileImage user={author} showBar />}

        <div className="flex-1">
          {/* Shared Header */}
          {isShared && (
            <p className="text-white text-left font-sans mb-2">
              {author.name} reposted
            </p>
          )}

          <div
            className={`flex flex-col gap-3 ${
              isShared ? "bg-gray-950 p-3 rounded-lg" : ""
            }`}
          >
            {/* Author/Header Section */}
            {isShared ? (
              <div className="flex items-center gap-3">
                <ProfileImage user={originalPost?.author} size="h-11 w-11" />
                <h4 className="cursor-pointer text-base-semibold text-light-1">
                  {originalPost?.author.name || "Unknown User"}
                </h4>
              </div>
            ) : (
              <div className="flex justify-between items-center w-full">
                <h4 className="font-semibold text-sm text-white">
                  {author.name || "Unknown User"}
                </h4>
                {currentUserId === author.id && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-400 hover:text-white transition"
                    aria-label="Edit post"
                  >
                    ✏️
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <p className="text-small-regular text-light-2 break-words">
              {content || "No content"}
            </p>

            {/* Images */}
            {images.length > 0 && (
              <div className="flex gap-3 items-start justify-start flex-wrap">
                {images.slice(0, 3).map((img, index) => (
                  <div
                    key={index}
                    className="relative flex-shrink-0"
                    style={{ width: "250px", height: "250px" }}
                  >
                    <Image
                      src={img}
                      alt={`content image ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 250px"
                      className="object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/default-image.png";
                      }}
                    />
                    {index === 2 && images.length > 3 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-2xl font-bold rounded-lg">
                        +{images.length - 3}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Date + Community */}
            <div className="flex items-center gap-4 mt-1 text-subtle-medium text-gray-1 text-xs sm:text-sm flex-wrap">
              <span>{getDisplayDate()}</span>

              {getDisplayCommunity() && (
                <Link
                  href={`/communities/${getDisplayCommunity()?.id}`}
                  className="flex items-center gap-1.5 group"
                >
                  <span className="group-hover:underline">
                    {getDisplayCommunity()?.name || "No Community"}
                  </span>
                  <Image
                    src={getDisplayCommunity()?.image || "/default-community.png"}
                    alt={getDisplayCommunity()?.name || "Community"}
                    width={18}
                    height={18}
                    className="rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/default-community.png";
                    }}
                  />
                </Link>
              )}
            </div>
          </div>

          {/* Replies Count (only for comments) */}
          {isComment && comments.length > 0 && (
            <Link href={`/thread/${id}`} className="mt-1 block">
              <p className="text-subtle-medium text-gray-1 text-xs">
                {comments.length} repl{comments.length === 1 ? "y" : "ies"}
              </p>
            </Link>
          )}

          {/* Actions */}
          <div className="flex flex-col mt-4">
            <div className="flex gap-3.5 items-center">
              <Suspense fallback={<div className="w-8 h-8 bg-gray-700 rounded animate-pulse" />}>
                <Upvote
                  id={id}
                  currentUserId={currentUserId}
                  upvoteCount={upvoteCount}
                />
              </Suspense>

              <Link href={`/thread/${id}`} className="flex items-center gap-1 group">
                <Image
                  src="/assets/reply.svg"
                  alt="reply"
                  width={20}
                  height={20}
                  className="cursor-pointer object-contain group-hover:opacity-80 transition"
                />
                <span className="text-white text-xs font-light group-hover:underline">
                  {comments.length}
                </span>
              </Link>

              <Repost id={id} currentUserId={currentUserId} />

              <button
                className="flex items-center gap-1 text-white/70 hover:text-white transition text-xs"
                aria-label="Share post"
              >
                <Image
                  src="/assets/share.svg"
                  alt="share"
                  width={20}
                  height={20}
                  className="cursor-pointer object-contain"
                />
                Share
              </button>
            </div>

            {/* Shared Date (if shared and not a comment) */}
            {isShared && !isComment && (
              <p className="mt-2 text-subtle-medium text-gray-1 text-xs">
                Shared on {formatDateString(createdAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  ) : (
    <div className="bg-dark-3 p-5 rounded-xl my-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Editing Thread</h2>
        <button
          onClick={() => setIsEditing(false)}
          className="text-red-400 hover:text-red-300 text-sm"
        >
          Cancel
        </button>
      </div>
      <PostThread
        userId={userIdfromDB?.toString()}
        data={{
          title: content,
          images: images,
          threadId: id,
        }}
        setIsEditing={setIsEditing}
        isEditing={true}
      />
    </div>
  );
};

export default ThreadCard;