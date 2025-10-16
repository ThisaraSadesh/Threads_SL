"use client";

import React, { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import ThreadCard from "../cards/ThreadCard";
import { fetchPosts } from "@/lib/actions/thread.actions";
import Image from "next/image";
import Loading from "@/app/(root)/loading";
import LoadingSpinner from "./LoadingSpinner";
const LoadMore = ({ userId }: { userId: string }) => {
  const [result, setResult] = React.useState<any[]>([]);
  const { ref, inView } = useInView();
  const pageRef = useRef(2);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);

useEffect(() => {
  const loadPosts = async () => {
    if (inView && !loading && hasMore) {
      setLoading(true);
      try {
        const newPosts = await fetchPosts(pageRef.current, 5);
        setHasMore(newPosts.isNext);
        if (newPosts.posts.length > 0) {
          setResult((prev) => [...prev, ...newPosts.posts]);
          pageRef.current += 1;
        } else {
          setHasMore(false);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  loadPosts();
}, [inView, loading, hasMore]);


  return (
    <div ref={ref}>
      <section className="flex flex-col gap-10">
        {loading && hasMore ? (
          <section className="flex justify-center items-center w-full">
            <LoadingSpinner />
          </section>
        ) : (
          <>
            {result.length === 0 ? (
              <p className="text-center text-gray-400">No posts found</p>
            ) : (
              result.map((post) => {
                if (post.status === "scheduled") return null;

                const upvotesArrLength = post.upvotes?.length;

                return (
                  <ThreadCard
                    key={post._id}
                    id={post._id}
                    currentUserId={userId}
                    parentId={post.parentId}
                    content={post.text.title}
                    images={post.text.images}
                    author={post.author}
                    community={post.community}
                    createdAt={post.createdAt}
                    comments={post.children}
                    upvoteCount={upvotesArrLength}
                    isShared={post.isShared}
                    SharedBy={post.sharedBy}
                    originalCommunity={post.originalCommunity}
                    originalPost={post.originalPost}
                    focusMode={post.focusMode}
                  />
                );
              })
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default LoadMore;
