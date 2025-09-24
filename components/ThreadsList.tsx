import ThreadCard from "@/components/cards/ThreadCard";
import Pagination from "@/components/shared/Pagination";
import { fetchPosts } from "@/lib/actions/thread.actions";

async function ThreadsList({ page, userId }: { page: number; userId: string }) {
  const result = await fetchPosts(page, 30);


  return (
    <section className="mt-9 flex flex-col gap-10">
      {result.posts.length === 0 ? (
        <p className="no-result">No threads found</p>
      ) : (
        <>
          {result.posts.map((post) => {
            const upvotesArrLength = post.upvotes?.length;
            return (
              <ThreadCard
                key={post._id}
                id={post._id}
                // currentUserId={userId.toString()}
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
              />
            );
          })}
        </>
      )}

      <Pagination path="/" pageNumber={page} isNext={result.isNext} />
    </section>
  );
}

export default ThreadsList;
