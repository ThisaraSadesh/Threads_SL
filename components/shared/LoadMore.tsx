"use client";

import React, { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import ThreadCard from "../cards/ThreadCard";
import { fetchPosts } from "@/lib/actions/thread.actions";

const LoadMore = ({ userId }: { userId: string }) => {
  const [result, setResult] = React.useState<any[]>([]);
  const { ref, inView } = useInView();
  const pageRef = useRef(2); // Use ref to persist page number between renders

  useEffect(() => {
    if (inView) {
      fetchPosts(pageRef.current, 5).then(newPosts => {
        if (newPosts.posts.length > 0) {
          setResult(prevPosts => [...prevPosts, ...newPosts.posts]);
          pageRef.current += 1;
        }
      });
    }
  }, [inView]);

  return (
    <div ref={ref}>
      <section className="flex flex-col gap-10">
        {result.length === 0 ? (
          <p className="no-result">No threads found</p>
        ) : (
          <>
            {result.map((post) => {
              const upvotesArrLength = post.upvotes?.length;
              if (post.status === "scheduled") return null;
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
            })}
          </>
        )}
      </section>
    </div>
  );
};

export default LoadMore;