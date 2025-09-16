import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchUser } from "@/lib/actions/user.actions";
import { Suspense } from "react";
import ThreadsList from "@/components/ThreadsList";
import { Skeleton } from "@/components/ui/skeleton";
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

      <Suspense fallback={<Skeleton/>}>
        <ThreadsList page={page} userId={userInfo._id} />
      </Suspense>
    </>
  );
}

export default Home;
