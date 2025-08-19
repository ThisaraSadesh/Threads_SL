import { fetchUser, fetchUsers } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Searchbar from "@/components/shared/Searchbar";

import { fetchCommunities } from "@/lib/actions/community.actions";
import CommunityCard from "@/components/cards/CommunityCard";
async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string }>;
}) {
  const user = await currentUser();
  const params = await searchParams;
  const q = params.q;

  if (!user) return null;

  const userInfo = await fetchUser(user.id);

  if (!userInfo?.onboarded) {
    console.log("redirecting to Onboarding");
    redirect("/onboarding");
  }

  const result = await fetchCommunities({
    searchString: q,
    pageNumber: 1,
    pageSize: 25,
  });

  return (
    <section>
      <h1 className="head-text mb-10">Communities</h1>
      <Searchbar routeType="communities" />
      <div className="mt-14 flex flex-col gap-9">
        {result?.communities.length === 0 ? (
          <p className="no-result">No users</p>
        ) : (
          <>
            {result?.communities.map((community) => (
              <CommunityCard
                key={community.id}
                id={community.id}
                name={community.name}
                username={community.username}
                imgUrl={community.image}
                bio={community.bio}
                members={community.members}
              />
            ))}
          </>
        )}
      </div>
    </section>
  );
}

export default Page;
