// app/thread/[id]/page.tsx
import ThreadCard from "@/components/cards/ThreadCard";
import Comment from "@/components/forms/Comment";
import { fetchThreadById } from "@/lib/actions/thread.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

interface Author {
  _id: string;
  id: string;
  name: string;
  image: string;
}

interface Community {
  _id: string;
  id: string;
  name: string;
  image: string;
}

interface ThreadText {
  title: string;
  images?: string[];
}

interface ThreadChild {
  _id: string;
  parentId?: string | null;
  text: ThreadText;
  author: Author;
  community?: Community | null;
  createdAt: string | Date;
  children?: ThreadChild[];
  upvotes?: string[];
}

interface Thread extends ThreadChild {
  children: ThreadChild[];
  sharedBy?: Author[];
  upvotes?: string[];
}

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const paramsId = (await params).id;

  if (!paramsId) {
    notFound();
  }

  const user = await currentUser();
  if (!user) {
    return null; // or redirect('/sign-in')
  }

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) {
    redirect("/onboarding");
  }

  const thread = await fetchThreadById(paramsId);

  if (!thread) {
    notFound(); // 👈 Better UX than console.error + null
  }

  const upvotesArrLength = thread.upvotes?.length || 0;

  // 💡 Helper function to safely format author/community for ThreadCard
  const formatAuthor = (author: Author | undefined) => {
    if (!author) return { name: "Unknown", image: "/default-avatar.png", id: "" };
    return {
      name: author.name || "Unknown",
      image: author.image || "/default-avatar.png",
      id: author.id?.toString() || author._id?.toString() || "",
    };
  };

  const formatCommunity = (community: Community | null | undefined) => {
    if (!community) return null;
    return {
      id: community.id?.toString() || community._id?.toString() || "",
      name: community.name || "No Community",
      image: community.image || "/default-community.png",
    };
  };

  return (
    <section className="relative">
      {/* Main Thread */}
      <div>
        <ThreadCard
          key={thread._id.toString()}
          id={thread._id.toString()}
          currentUserId={userInfo._id?.toString() || ""}
          parentId={thread.parentId?.toString() || ""}
          content={thread.text?.title || ""}
          images={thread.text?.images || []}
          author={formatAuthor(thread.author)}
          community={formatCommunity(thread.community)}
          createdAt={new Date(thread.createdAt).toISOString()}
          comments={thread.children || []}
          upvoteCount={upvotesArrLength}
        />
      </div>

      {/* Comment Form */}
      <div className="mt-7">
        <Comment
          threadId={thread._id.toString()}
          currentUserImg={userInfo.image || "/default-avatar.png"}
          currentUserId={userInfo._id?.toString() || ""}
        />
      </div>

      {/* Replies / Children Threads */}
      <div className="mt-10 space-y-6">
        {(thread.children || []).map((child) => (
          <ThreadCard
            key={child._id.toString()}
            id={child._id.toString()}
            currentUserId={userInfo._id?.toString() || ""}
            parentId={child.parentId?.toString() || ""}
            content={child.text?.title || ""}
            images={child.text?.images || []}
            author={formatAuthor(child.author)}
            community={formatCommunity(child.community)}
            createdAt={new Date(child.createdAt).toISOString()}
            comments={child.children || []}
            isComment={true}
            upvoteCount={child.upvotes?.length || 0} // ⚠️ Use child's own upvotes, not parent's!
          />
        ))}
      </div>
    </section>
  );
};

export default Page;