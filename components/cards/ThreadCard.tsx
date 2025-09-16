import Community from "@/lib/models/community.model";
import { formatDateString } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import Upvote from "../Upvote";
import { Suspense } from "react";
import Repost from "../Repost";
import { ObjectId } from "mongoose";
import { ProfileImage } from "../shared/ProfileImage";

export const experimental_ppr = true;

interface Props {
  id: string;
  currentUserId: string;
  parentId: string;
  content: string;
  author: {
    name: string;
    image: string;
    id: string;
  };
  community: {
    id: string;
    name: string;
    image: string;
  } | null;

  createdAt: string;
  comments: {
    author: {
      image: string;
    };
  }[];

  isComment?: boolean;
  upvoteCount: number;
  isShared?: boolean;
  SharedBy?: [
    {
      name: string;
      image: string;
      id: string;
    }
  ];
  userIdfromDB?: ObjectId;
  originalCommunity?: {
    id: string;
    name: string;
    image: string;
  };
  originalPost?: {
    id: string;
    createdAt: Date;
    author: {
      _id: string;
      id: string;
      name: string;
      image?: string;
    };
  };
}

const ThreadCard = async ({
  id,
  currentUserId,
  parentId,
  content,
  author,
  community,
  createdAt,
  comments,
  isComment,
  upvoteCount,
  isShared,
  SharedBy,
  userIdfromDB,
  originalCommunity,
  originalPost,
}: Props) => {
  return (
    <article
      className={`flex w-full flex-col rounded-xl h-full ${
        isComment ? "px-0 xs:px-7" : "bg-dark-2 p-7"
      }`}
    >
      <div className="flex gap-3 w-full">
        <ProfileImage user={author} showBar />

        <div className="flex-1">
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
            {/* Header: Original author for shared, else author */}
            {isShared ? (
              <div className="flex items-center gap-3">
                <ProfileImage user={originalPost?.author} size="h-11 w-11" />
                <h1 className="cursor-pointer text-base-semibold text-light-1">
                  {originalPost?.author.name}
                </h1>
              </div>
            ) : (
              <h1 className="cursor-pointer text-base-semibold text-light-1">
                {author.name}
              </h1>
            )}

            <p className="text-small-regular text-light-2">{content}</p>

            {/* Original post created date for shared */}
            {isShared && (
              <p className="text-subtle-medium text-gray-1 text-sm mt-1">
                {formatDateString(originalPost?.createdAt)}
              </p>
            )}

            {/* Community inside the post */}
            {(isShared ? originalCommunity : community) && (
              <Link
                href={`/communities/${
                  isShared ? originalCommunity?.id : community?.id
                }`}
                className="flex items-center gap-2 mt-1"
              >
                <p className="text-subtle-medium text-gray-1 text-sm">
                  {(isShared ? originalCommunity?.name : community?.name) ||
                    "No Community"}
                </p>
                <Image
                  src={
                    (isShared ? originalCommunity?.image : community?.image) ||
                    "/default-community.png"
                  }
                  alt={
                    (isShared ? originalCommunity?.name : community?.name) ||
                    "Community"
                  }
                  width={20}
                  height={20}
                  className="rounded-full w-[20px] h-[20px]"
                />
              </Link>
            )}
          </div>

          {isComment && comments.length > 0 && (
            <Link href={`/thread/${id}`}>
              <p className="mt-1 text-subtle-medium text-gray-1">
                {comments.length} replies
              </p>
            </Link>
          )}

          {/* Action buttons and shared date outside the post */}
          <div className="flex flex-col mt-3">
            <div className="flex gap-3.5">
              <Suspense fallback={<p>...Loading</p>}>
                <Upvote
                  id={id.toString()}
                  currentUserId={currentUserId}
                  upvoteCount={upvoteCount}
                />
              </Suspense>

              <Link href={`/thread/${id}`} className="flex items-center gap-1">
                <Image
                  src="/assets/reply.svg"
                  alt="reply"
                  width={24}
                  height={24}
                  className="cursor-pointer object-contain"
                />
                <p className="text-white text-md font-extralight">
                  {comments.length}
                </p>
              </Link>

              <Repost id={id} currentUserId={currentUserId} />
              <Image
                src="/assets/share.svg"
                alt="share"
                width={24}
                height={24}
                className="cursor-pointer object-contain"
              />
            </div>

            {/* Shared date for shared posts */}
            {isShared && !isComment && (
              <p className="mt-2 text-subtle-medium text-gray-1 text-sm">
                 {formatDateString(createdAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ThreadCard;
