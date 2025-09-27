
import { fetchUserPosts } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import ThreadCard from "../cards/ThreadCard";
import { fetchCommunityPosts } from "@/lib/actions/community.actions";
import { Button } from "../ui/button";
import { deleteThread, fetchAllChildThreads, fetchUserTaggedPosts } from "@/lib/actions/thread.actions";

interface Props {
  currentUserId: string;
  accountId: string;
  accountType: string;
}

const TaggedTab = async ({ currentUserId, accountId, accountType }: Props) => {
  let result: any;
  const path = `/profile/${currentUserId}`;
  if (accountType === "Community") {
    // result = await fetchCommunityTaggedPosts(accountId);
  } else {
    result = await fetchUserTaggedPosts(accountId);
  }

  if (!result) redirect("/");
  const handleDelete = async (threadId: string) => {
    'use server'
    await deleteThread(threadId, path);
  };
  const taggedCount=result.taggedCount;
  return (
        <section className="mt-9 flex flex-col gap-10">
      {result.threads.map((thread: any) => (
        <div
          key={thread._id}
          className="flex items-center gap-4 bg-dark-2 px-5 py-5 rounded-2xl"
        >
          <ThreadCard
            key={thread._id}
            id={thread._id}
            currentUserId={currentUserId}
            parentId={thread.parentId}
            content={thread.text.title}
            author={
              accountType === "User"
                ? { name: thread.author.name, image: thread.author.image, id: thread.author.id }
                : {
                    name: thread.author.name,
                    image: thread.author.image,
                    id: thread.author.id,
                  }
            }
            community={thread.community}
            createdAt={thread.createdAt}
            comments={thread.children}
            upvoteCount={thread.upvotes.length}
          />
          <form action={handleDelete.bind(null, thread._id)}>
            <Button type="submit" className="bg-primary-500">
              Delete
            </Button>
          </form>
        </div>
      ))}
    </section>
  );
};

export default TaggedTab;
