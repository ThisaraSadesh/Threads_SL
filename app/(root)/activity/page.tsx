import { fetchUser, getActivity } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";

import Link from "next/link";
import { fetchUserNotifications } from "@/lib/actions/notification.actions";
async function Page() {
  const user = await currentUser();

  if (!user) return null;

  const userInfo = await fetchUser(user.id);

  if (!userInfo?.onboarded) {
    redirect("/onboarding");
  }

 // utils/notificationDisplay.tsx

 const displayType = (type: string) => {
  switch (type) {
    case "mention":
      return <span className="text-blue-500">mentioned you</span>;

    case "like":
      return <span className="text-pink-500">liked your post</span>;

    case "follow":
      return <span className="text-green-500">followed you</span>;

    case "repost":
      return <span className="text-purple-500">reposted your thread</span>;

    case "comment":
      return <span className="text-yellow-500">commented on your post</span>;

    default:
      return <span className="text-gray-400">notified you</span>;
  }
};

  const activity = await fetchUserNotifications(userInfo._id);
  console.log("ACTIVITIES FETCHEd", activity);
  return (
    <section>
      <h1 className="head-text mb-10">Activity</h1>
      <section className="mt-10 flex flex-col gap-5">
        {activity.length > 0 ? (
          <>
            {activity.map((activity) => (
              <Link key={activity._id} href={`/thread/${activity.entityId}`}>
                <article className="activity-card">
                  <Image
                    src={activity.actorId.image}
                    alt="Profile Picture"
                    width={20}
                    height={20}
                    className="rounded-full object-cover w-[20px] h-[20px]"
                  />

                  <p className="!text-small-regular text-light-1">
                    <span className="mr-1 text-primary-500">
                      {activity.actorId.name}
                    </span>{" "}
                    {displayType(activity.type)}
                  </p>
                </article>
              </Link>
            ))}
          </>
        ) : (
          <p className="!text-base-regular text-light-3">No Activity</p>
        )}
      </section>
    </section>
  );
}

export default Page;
