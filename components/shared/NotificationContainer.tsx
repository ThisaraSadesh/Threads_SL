'use client'

import { formatDateString } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const NotificationContainer = ({ notifications,handleClickNotification }) => {

  const displayType = (type: string) => {
    switch (type) {
      case "mention":
        return <span className="text-blue-500">mentioned you in a post</span>;

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

  return (
    <div className="flex flex-col items-center justify-start ">
      {notifications &&
        notifications.map((note: any) => (
          <>
            <Link
              key={note._id}
              href={`/thread/${note.entityId}`}
              onClick={()=>handleClickNotification(note._id,note.read)}
            >
              <div className="activity-card text-white">
                <Image
                  src={note.actorId.image}
                  alt="Profile Picture"
                  width={20}
                  height={20}
                  className="rounded-full object-cover w-[20px] h-[20px]"
                />
                <div className=" flex gap-5 items-center justify-center">
                  <p
                    className={`${
                      note.read ? "font-normal" : "font-bold"
                    } text-xs`}
                  >
                    <span className="mr-1 text-primary-500">
                      {note.actorId.name}
                    </span>{" "}
                    {displayType(note.type)}
                  </p>

                  <p className="text-subtle-semibold">
                    {formatDateString(note.createdAt.toString())}
                  </p>
                </div>
              </div>
            </Link>
          </>
        ))}
    </div>
  );
};

export default NotificationContainer;
