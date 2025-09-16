import Link from "next/link";
import Image from "next/image";

export const ProfileImage = ({ user, showBar = false, size = "h-11 w-11" }) => (
  <div className="flex flex-col items-center">
    <Link href={`/profile/${user?.id}`} className={`relative ${size}`}>
      <Image
        src={user?.image || "/default-avatar.png"}
        alt={user?.name || "Profile Image"}
        fill
        sizes="(max-width: 768px) 100px, 50px"
        className="cursor-pointer rounded-full"
        priority={false}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
      />
    </Link>
    {showBar && <div className="thread-card_bar" />}
  </div>
);
