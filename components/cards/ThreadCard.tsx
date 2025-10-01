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
import { CarouselSize } from "../shared/Carousel";
import { MeatBallMenu } from "../shared/MeatBallMenu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

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
  createdAt: string;
  comments: Array<{ author: { image: string } }>;
  isComment?: boolean;
  upvoteCount: number;
  isShared?: boolean;
  SharedBy?: Author[];
  userIdfromDB?: ObjectId;
  originalCommunity?: Community;
  originalPost?: OriginalPost;
  focusMode: boolean;
  expiresAt?:string
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
  focusMode,
  expiresAt
}: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showCarousel, setShowCarousel] = useState(false);
  const getDisplayDate = () => {
    if (isShared && originalPost?.createdAt) {
      return formatDateString(originalPost.createdAt);
    }
    return formatDateString(createdAt);
  };

  const getDisplayCommunity = () => {
    if (isShared && originalCommunity) return originalCommunity;
    return community;
  };
  function MentionHighlighter({ content }: { content: string }) {
    if (!content) return <span className="text-light-2">No content</span>;

    const parts = content.split(/(\s+)/);

    return (
      <p className="text-small-regular break-words text-light-2">
        {" "}
        {/* 👈 Apply color here */}
        {parts.map((part, index) => {
          if (part.startsWith("@") && !part.includes(" ")) {
            return (
              <span key={index} className="text-blue font-medium">
                {part}
              </span>
            );
          }
          return <span key={index}>{part}</span>; // Inherits color from parent <p>
        })}
      </p>
    );
  }

  return !isEditing ? (
    <article
      className={`flex w-full flex-col rounded-xl ${
        isComment ? "px-0 xs:px-7" : "bg-dark-2 p-7"
      }`}
    >
      <div className="flex gap-3 w-full">
        {!isShared && <ProfileImage user={author} showBar />}

        <div className="flex-1">
          {isShared && (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <ProfileImage user={author} showBar />
              <p className="text-white text-left font-sans">
                {author.name} reposted
              </p>
            </div>
          )}

          <div
            className={`flex flex-col gap-3 ${
              isShared ? "bg-black p-3 rounded-lg" : ""
            }`}
          >
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

                <div className="flex gap-3 items-center justify-center">
                  {focusMode ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div onClick={(e) => e.preventDefault()}>
                          <Image
                            width={20}
                            height={20}
                            src={"assets/timer.svg"}
                            alt="timer"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="line-clamp-4 text-x-small-semibold">
                         Focus Mode Enabled ✔︎
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ):expiresAt?(
                    <span className="text-red-500 text-small-regular">Expires at : {formatDateString(expiresAt)}</span>

                  ):null}
                  {currentUserId?.toString() === author._id && (
                    <MeatBallMenu setIsEditing={setIsEditing} id={id} />
                  )}
                </div>
              </div>
            )}

            <MentionHighlighter content={content} />

            {images.length > 0 && (
              <div className="flex gap-3 items-start justify-start flex-wrap">
                {images.slice(0, 3).map((img, index) => (
                  <div
                    key={index}
                    className="relative flex-shrink-0"
                    style={{ width: "250px", height: "250px" }}
                    onClick={() => setShowCarousel(true)}
                  >
                    <Image
                      src={img}
                      alt={`content image ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 250px"
                      className="object-cover rounded-lg cursor-pointer"
                    />
                    {index === 2 && images.length > 3 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-2xl font-bold rounded-lg">
                        +{images.length - 3}
                      </div>
                    )}
                  </div>
                ))}
                {showCarousel && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="relative w-fit flex flex-col items-end justify-center bg-transparent">
                      <button
                        onClick={() => setShowCarousel(false)}
                        className=" text-white text-4xl"
                      >
                        ✕
                      </button>

                      <CarouselSize array={images} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 mt-1 text-subtle-medium text-gray-1 text-xs sm:text-sm flex-wrap">
              <span>{getDisplayDate()}</span>
            </div>
          </div>

          {isComment && comments.length > 0 && (
            <Link href={`/thread/${id}`} className="mt-1 block">
              <p className="text-subtle-medium text-gray-1 text-xs">
                {comments.length} repl{comments.length === 1 ? "y" : "ies"}
              </p>
            </Link>
          )}

          <div className="flex flex-col mt-4">
            <div className="flex gap-3.5 items-center">
              <Suspense
                fallback={
                  <div className="w-8 h-8 bg-gray-700 rounded animate-pulse" />
                }
              >
                <Upvote
                  id={id}
                  currentUserId={currentUserId}
                  upvoteCount={upvoteCount}
                />
              </Suspense>

              <Link
                href={`/thread/${id}`}
                className="flex items-center gap-1 group"
                prefetch={true}
              >
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

              <Repost
                id={id.toString()}
                currentUserId={currentUserId.toString()}
              />

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

            {isShared && !isComment && getDisplayCommunity() && (
              <div className="flex items-center justify-start gap-2 mt-5">
                <p className="text-subtle-medium text-gray-1 text-xs">
                  {formatDateString(createdAt)}
                </p>

                <Link
                  href={`/communities/${getDisplayCommunity()?.id}`}
                  className="flex items-center gap-1.5 group   rounded"
                >
                  <span className="text-gray-1 group-hover:underline text-subtle-medium">
                    -{getDisplayCommunity()?.name || "No Community"}
                  </span>
                  <Image
                    src={
                      getDisplayCommunity()?.image || "/default-community.png"
                    }
                    alt={getDisplayCommunity()?.name || "Community"}
                    width={16}
                    height={16}
                    className="rounded-full w-[16px] h-[16px]"
                  />
                </Link>
              </div>
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
