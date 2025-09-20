import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchUser } from "@/lib/actions/user.actions";
import ThreadsList from "@/components/ThreadsList";

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
      {/* <PostThread userId={userInfo._id.toString()} />{" "} */}
      <ThreadsList page={page} userId={userInfo._id} />
    </>
  );
}

export default Home;
