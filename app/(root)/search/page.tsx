import { fetchUser, fetchUsers } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Searchbar from "@/components/shared/Searchbar";

import UserCard from "@/components/cards/UserCard";
async function Page({
  searchParams,
}: {
  searchParams:Promise< { [key: string]: string }>;
}) {
  const params=await searchParams;
  const  q  =params.q;
  const user = await currentUser();

  if (!user) return null;

  const userInfo = await fetchUser(user.id);

  if (!userInfo?.onboarded) {
    console.log("redirecting to Onboarding");
    redirect("/onboarding");
  }

  const result = await fetchUsers({
    userId: user.id,
    searchString: q,
    pageNumber: 1,
    pageSize: 25,
  });

  return (
    <section>
      <h1 className="head-text mb-10">Search</h1>
      <Searchbar routeType="search" />
      <div className="mt-14 flex flex-col gap-9">
        {result?.users.length === 0 ? (
          <p className="no-result">No users</p>
        ) : (
          <>
            {result?.users.map((user) => (
              <UserCard
                key={user.id}
                id={user.id}
                name={user.name}
                username={user.username}
                imgUrl={user.image}
                personType="User"
              />
            ))}
          </>
        )}
      </div>
    </section>
  );
}

export default Page;
