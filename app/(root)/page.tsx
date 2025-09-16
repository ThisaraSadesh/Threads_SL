import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import ThreadCard from "@/components/cards/ThreadCard";
import Pagination from "@/components/shared/Pagination";

import { fetchPosts } from "@/lib/actions/thread.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import { Suspense } from "react";
import ThreadsList from "@/components/ThreadsList";
export const experimental_ppr = true;
async function Home(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const page = searchParams.page ? +searchParams.page : 1;

  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  return (
    <>
      <h1 className="head-text text-left">Home</h1>

      <Suspense fallback={<p>...Loading Threads</p>}>
        <ThreadsList page={page} userId={user.id} />
      </Suspense>
    </>
  );
}

export default Home;
