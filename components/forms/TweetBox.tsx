import React, { useState } from "react";
import Image from "next/image";

export default function TweetComposer() {
  const [text, setText] = useState("");

  return (
    <div className="bg-dark-2 p-4 rounded-xl w-full max-w-xl">
      {/* User info + textarea */}
      <div className="flex gap-3">
        <Image
          src="/path/to/profile.jpg"
          alt="Profile"
          width={50}
          height={50}
          className="rounded-full"
        />
        <textarea
          className="bg-transparent text-white w-full resize-none outline-none placeholder-gray-400"
          placeholder="What’s happening?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />
      </div>

      {/* Reply permission */}
      <p className="text-blue-500 text-sm mt-2">🌐 Everyone can reply</p>

      {/* Action icons */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-4 text-gray-400">
          {/* Replace src with actual icon paths */}
          <Image src="/icons/image.svg" alt="Image" width={24} height={24} />
          <Image src="/icons/gif.svg" alt="GIF" width={24} height={24} />
          <Image src="/icons/poll.svg" alt="Poll" width={24} height={24} />
          <Image src="/icons/emoji.svg" alt="Emoji" width={24} height={24} />
          <Image src="/icons/camera.svg" alt="Camera" width={24} height={24} />
          <Image src="/icons/location.svg" alt="Location" width={24} height={24} />
        </div>

        {/* Post button */}
        <button
          disabled={!text}
          className={`px-4 py-2 rounded-full font-semibold ${
            text
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-600 text-gray-400 cursor-not-allowed"
          }`}
        >
          Post
        </button>
      </div>
    </div>
  );
}
