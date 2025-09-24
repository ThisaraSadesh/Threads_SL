"use client";

import { formatDateString, formatTimeAgo } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const NotificationContainer = ({ notifications, handleClickNotification }) => {
    const sortedNotifications = notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const displayType = (type: string) => {
    switch (type) {
      case "mention":
        return <span className="text-gray-400">mentioned you in a post @</span>;

      case "upvote":
        return <span className="text-gray-400">liked your post ❤️</span>;

      case "follow":
        return <span className="text-gray-400">followed you 👉</span>;

      case "repost":
        return <span className="text-gray-400">reposted your thread 🔁</span>;

      case "comment":
        return <span className="text-gray-400">commented on your post 💬</span>;

      default:
        return <span className="text-gray-400">notified you 🔔</span>;
    }
  };

  return (
    <div className="flex flex-col items-center  justify-start gap-3 overflow-y-scroll overflow-x-hidden h-[465px]">
      {sortedNotifications &&
        sortedNotifications.map((note: any) => (
          <Link
            key={note._id}
            href={`/thread/${note.entityId}`}
            onClick={() => handleClickNotification(note._id, note.read)}
          >
            <div className="activity-card text-white">
              <Image
                src={note.actorId.image}
                alt="Profile Picture"
                width={40}
                height={40}
                className="rounded-full object-cover w-[40px] h-[40px]"
              />
              <div className=" flex gap-5 items-center justify-center">
                <p
                  className={`${
                    note.read ? "font-normal" : "font-bold"
                  } text-xs line-clamp-2  `}
                >
                  <span className="mr-1 text-primary-500">
                    {note.actorId.name}
                  </span>
                  {displayType(note.type)}
                </p>

                <p className="text-subtle-semibold">
                  {formatTimeAgo(note.createdAt.toString())}
                </p>
              </div>
            </div>
          </Link>
        ))}
    </div>
  );
};

export default NotificationContainer;
