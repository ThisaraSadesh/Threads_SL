
import { fetchUserPosts } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import ThreadCard from "../cards/ThreadCard";
import { fetchCommunityPosts } from "@/lib/actions/community.actions";
import { Button } from "../ui/button";
import { deleteThread, fetchAllChildThreads } from "@/lib/actions/thread.actions";

interface Props {
  currentUserId: string;
  accountId: string;
  accountType: string;
}

const RepliesTab = async ({ currentUserId, accountId, accountType }: Props) => {
  let result: any;
  const path = `/profile/${currentUserId}`;
  if (accountType === "Community") {
    result = await fetchCommunityPosts(accountId);
  } else {
    result = await fetchUserPosts(accountId);
  }

  if (!result) redirect("/");
  const handleDelete = async (threadId: string) => {
    'use server'
    await deleteThread(threadId, path);
  };

  return (
    <section className="mt-9 flex flex-col gap-10">
      {result.threads?.map(async (thread: any) => {
        // Fetch children for each thread
        const children = await fetchAllChildThreads(thread._id);

        // If no children, skip rendering anything for this thread
        if (!children || children.length === 0) return null;

        return (
          <div key={thread._id} className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-gray-200">
              Replies to: {thread.text.title || "Untitled Thread"}
            </h3>
            {children.map((child: any) => (
              <div
                key={child._id}
                className="flex items-center gap-4 bg-dark-2 px-5 py-5 rounded-2xl"
              >
                <ThreadCard
                  id={child._id}
                  currentUserId={currentUserId}
                  parentId={child.parentId}
                  content={child.text.title}
                  author={
                    accountType === "User"
                      ? { name: result.name, image: result.image, id: result.id }
                      : {
                          name: child.author.name,
                          image: child.author.image,
                          id: child.author.id,
                        }
                  }
                  community={child.community}
                  createdAt={child.createdAt}
                  comments={child.children} // optional: nested replies
                  upvoteCount={child.upvotes?.length || 0}
                />
                <form
                  action={async () => {
                    "use server";
                    await deleteThread(child._id, path);
                  }}
                >
                  <Button type="submit" className="bg-primary-500">
                    Delete
                  </Button>
                </form>
              </div>
            ))}
          </div>
        );
      })}
    </section>
  );
};

export default RepliesTab;
