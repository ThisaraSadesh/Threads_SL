import ThreadCard from "@/components/cards/ThreadCard";
import Comment from "@/components/forms/Comment";
import { fetchThreadById } from "@/lib/actions/thread.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  
  const paramsId=(await params).id;
  if (!paramsId) return null;


  const user = await currentUser();
  if (!user) {
    return null;
  }
  const userInfo = await fetchUser(user.id);

  if (!userInfo?.onboarded) redirect("/onboarding");

  const thread = await fetchThreadById(paramsId);
  if(!thread){
    console.error('Thread Not Found');
  }
  const upvotesArrLength=thread.upvotes?.length;
  return (
    <section className="relative">
      <div>
        <ThreadCard
          key={thread._id}
          id={thread._id}
          currentUserId={user?._id || ""}
          parentId={thread.parentId}
          content={thread.text.title}
          images={thread.text.images}
          author={thread.author}
          community={thread.community}
          createdAt={thread.createdAt}
          comments={thread.children}
          upvoteCount={upvotesArrLength}
        />
      </div>

      <div className="mt-7">
        <Comment
          threadId={thread.id}
          currentUserImg={userInfo.image}
          currentUserId={JSON.stringify(userInfo._id)}
        />
      </div>
      <div className="mt-10">
        {thread.children.map((child: any) => (
          <ThreadCard
            key={child._id}
            id={child._id}
            currentUserId={user?.id || ""}
            parentId={child.parentId}
            content={child.text.title}
            images={child.text.images}
            author={child.author}
            community={child.community}
            createdAt={child.createdAt}
            comments={child.children}
            isComment={true}
            upvoteCount={upvotesArrLength}
          />
        ))}
      </div>
    </section>
  );
};

export default page;
