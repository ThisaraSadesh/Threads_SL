import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { profileTabs } from "@/constants";

import ThreadsTab from "@/components/shared/ThreadsTab";
import ProfileHeader from "@/components/shared/ProfileHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { fetchUser } from "@/lib/actions/user.actions";
import RepliesTab from "@/components/shared/RepliesTab";
import { fetchAllChildThreads } from "@/lib/actions/thread.actions";

export default async function Page({ params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(params.id);
  console.log("USER INFO DATA", userInfo);
  if (!userInfo?.onboarded) {
    console.log("id from params:", params.id);
    console.log("onboarded is false, redirecting to /onboarding");
    redirect("/onboarding");
  }

  const childThreadsCount = userInfo.threads.map(async (thread: any) => {
    const childthreads = await fetchAllChildThreads(thread._id);
    if (!childthreads || childthreads.length === 0) return null;

    return childthreads.length;
  });

  return (
    <section>
      <ProfileHeader
        accountId={userInfo.id}
        authUserId={user.id}
        name={userInfo.name}
        username={userInfo.username}
        imgUrl={userInfo.image}
        bio={userInfo.bio}
      />

      <div className="mt-9">
        <Tabs defaultValue="threads" className="w-full">
          <TabsList className="tab">
            {profileTabs.map((tab) => (
              <TabsTrigger key={tab.label} value={tab.value} className="tab">
                <Image
                  src={tab.icon}
                  alt={tab.label}
                  width={24}
                  height={24}
                  className="object-contain"
                />
                <p className="max-sm:hidden">{tab.label}</p>

                {tab.label === "Threads" ? (
                  <p className="ml-1 rounded-sm bg-light-4 px-2 py-1 !text-tiny-medium text-light-2">
                    {userInfo.threads.length}
                  </p>
                ) : tab.label === "Replies" ? (
                  <p className="ml-1 rounded-sm bg-light-4 px-2 py-1 !text-tiny-medium text-light-2">
                    {childThreadsCount}
                  </p>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
          {profileTabs.map((tab) => (
            <TabsContent
              key={`content-${tab.label}`}
              value={tab.value}
              className="w-full text-light-1"
            >
              {tab.value === "threads" && (
                <ThreadsTab
                  currentUserId={user.id}
                  accountId={userInfo.id}
                  accountType="User"
                />
              )}
              {tab.value === "replies" && (
                <RepliesTab
                  currentUserId={user.id}
                  accountId={userInfo.id}
                  accountType="User"
                />
              )}
              {tab.value === "tagged" && (
                <div>
                  <p>Tagged content will go here</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
