"use server";

import { revalidatePath } from "next/cache";

import connectToDB from "../mongoose";

import User from "../models/user.model";
import Thread from "../models/thread.model";
import Community from "../models/community.model";
import { filterToxicComments } from "./filterThreads";
import { ObjectId, Document } from "mongoose";
import { extractMentions } from "@/constants";
import Notification from "../models/notification.model";
import Ably from "ably";

export const fetchPosts = async (pageNumber = 1, pageSize = 20) => {
  await connectToDB();

  const skipAmount = (pageNumber - 1) * pageSize;

  const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
    .sort({ createdAt: "desc" })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({
      path: "author",
      model: User,
      select: "_id id name image", // explicitly select fields
    })
    .populate([
      {
        path: "sharedBy",
        model: User,
        select: "_id id name image",
      },
    ])
    .populate({
      path: "community",
      model: Community,
      select: "_id id name image", // optional: add more fields
    })
    .populate({
      path: "originalCommunity",
      model: Community,
      select: "_id id name image",
    })
    .populate({
      path: "originalPost",
      model: "Thread",
      select: "_id id createdAt author",
      populate: {
        path: "author",
        model: "User",
        select: "_id id name image",
      },
    })
    .populate({
      path: "children",
      populate: {
        path: "author",
        model: User,
        select: "_id id name image",
      },
    })
    .lean(); // Important: returns plain JS objects, no Mongoose wrappers

  const totalPostsCount = await Thread.countDocuments({
    parentId: { $in: [null, undefined] },
  });

  let posts = await postsQuery.exec();

  // 💥 CRITICAL: Recursively convert all _id fields to strings
  const cleanPosts = JSON.parse(JSON.stringify(posts));

  const isNext = totalPostsCount > skipAmount + posts.length;

  return { posts: cleanPosts, isNext };
};

interface Params {
  text: {
    title: string;
    images: string[];
  };
  author: string;
  communityId: string | null;
  path: string;
}
interface ThreadType extends Document {
  text: {
    title: string;
    images: string[];
  };
  author: ObjectId;
  community: ObjectId;
  children: ObjectId[];
  createdAt: Date;
  upvotes: string[];
}
interface UpdateParams {
  threadId: string;
  newText: { title: string; images?: string[] };
  path: string;
}
export async function createThread({
  text,
  author,
  communityId,
  path,
}: {
  text: { title: string; images?: string[] };
  author: string;
  communityId: string | null;
  path: string;
}) {
  try {
    await connectToDB();

    console.log("Community ID:", communityId);

    let communityIdObject = null;
    if (communityId) {
      const found = await Community.findOne({ id: communityId }, { _id: 1 });
      communityIdObject = found?._id || null;
    }

    const result: any = await filterToxicComments(text.title);
    console.log("RESULTTT", result);
    const classes = result?.moderation_classes;

    if (!classes) {
      throw new Error("Moderation API did not return classes");
    }

    if (
      (classes.sexual ?? 0) > 0.1 ||
      (classes.violent ?? 0) > 0.1 ||
      (classes.toxic ?? 0) > 0.1
    ) {
      return {
        message: "Your Thread contains sexual, violent, or toxic content!",
        status: 400, // ⚠️ Use 400 for bad input, not 201
      };
    }

    const mentions = extractMentions(text.title);

    const mentionedUsers = await Promise.all(
      mentions.map(async (username) => {
        const user = await User.findOne({ username }).select("_id");
        return user?._id || null;
      })
    );

    const validMentionedUserIds = mentionedUsers.filter(
      (id) => id && id.toString() !== author.toString()
    );

    if (validMentionedUserIds.length > 0) {
      await Notification.insertMany(
        validMentionedUserIds.map((userId) => ({
          userId,
          actorId: author,
          type: "mention",
          entityId: null,
          excerpt: text.title,
          read: false,
        }))
      );
    }
    console.log("Notification Inserted");

    const createdThread = await Thread.create({
      text,
      author,
      community: communityIdObject,
    });

    if (validMentionedUserIds.length > 0) {
      await Notification.updateMany(
        {
          userId: { $in: validMentionedUserIds },
          entityId: null,
          actorId: author,
        },
        { $set: { entityId: createdThread._id } }
      );
    }

    const ably = new Ably.Rest(process.env.ABLY_API_KEY!);
    const threadAuthor = await User.findById(createdThread.author);
    if (!threadAuthor) {
      console.error("Thread author not found");
      return { success: false, message: "Thread author not found" };
    }
    for (const userId of validMentionedUserIds) {
      const mentionedUser = await User.findById(userId);
      if (mentionedUser?.id) {
        await ably.channels
          .get(`user-${mentionedUser.id}`)
          .publish("new-notification", {
            title: `You were mentioned by ${threadAuthor.username}`,
            threadId: createdThread._id,
          });
      }
    }

    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id },
    });

    if (communityIdObject) {
      await Community.findByIdAndUpdate(communityIdObject, {
        $push: { threads: createdThread._id },
      });
    }

    revalidatePath(path);

    return { success: true, status: 201 };
  } catch (error: any) {
    console.error("CREATE THREAD ERROR:", error);
    throw new Error(`Failed to create thread: ${error.message}`);
  }
}

export const fetchAllChildThreads = async (
  threadId: string
): Promise<any[]> => {
  const childThreads = await Thread.find({ parentId: threadId }).lean();

  const descendantThreads = [];
  for (const childThread of childThreads) {
    const descendants = await fetchAllChildThreads(childThread._id);
    descendantThreads.push(childThread, ...descendants);
  }

  return descendantThreads;
};
export async function deleteThread(id: string, path: string) {
  try {
    await connectToDB();

    // Find the thread to be deleted (the main thread)
    const mainThread = await Thread.findById(id).populate("author community");

    if (!mainThread) {
      throw new Error("Thread not found");
    }

    // Fetch all child threads and their descendants recursively
    const descendantThreads = await fetchAllChildThreads(id);

    // Get all descendant thread IDs including the main thread ID and child thread IDs
    const descendantThreadIds = [
      id,
      ...descendantThreads.map((thread) => thread._id),
    ];

    // Extract the authorIds and communityIds to update User and Community models respectively
    const uniqueAuthorIds = new Set(
      [
        ...descendantThreads.map((thread) => thread.author?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainThread.author?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    const uniqueCommunityIds = new Set(
      [
        ...descendantThreads.map((thread) => thread.community?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainThread.community?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    // Recursively delete child threads and their descendants
    await Thread.deleteMany({ _id: { $in: descendantThreadIds } });

    // Update User model
    await User.updateMany(
      { _id: { $in: Array.from(uniqueAuthorIds) } },
      { $pull: { threads: { $in: descendantThreadIds } } }
    );

    // Update Community model
    await Community.updateMany(
      { _id: { $in: Array.from(uniqueCommunityIds) } },
      { $pull: { threads: { $in: descendantThreadIds } } }
    );

    revalidatePath(path);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to delete thread: ${error.message}`);
  }
}

export const fetchThreadById = async (threadId: string) => {
  await connectToDB();

  try {
    const thread = await Thread.findById(threadId)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      })
      .populate({
        path: "sharedBy",
        model: User,
        select: "_id id name image",
      })
      .populate({
        path: "community",
        model: Community,
        select: "_id id name image",
      })
      .populate({
        path: "children",
        populate: [
          {
            path: "author",
            model: User,
            select: "_id id name image",
          },
        ],
        options: {
          limit: 50,
        },
      })
      .lean();

    if (!thread) {
      return null;
    }

    return thread;
  } catch (err) {
    console.error("Error while fetching thread:", err);
    throw new Error("Unable to fetch thread");
  }
};

export async function addCommentToThread(
  threadId: string,
  commentText: string,
  userId: string,
  path: string
) {
  await connectToDB();

  try {
    // Find the original thread by its ID
    const originalThread = await Thread.findById(threadId);

    if (!originalThread) {
      throw new Error("Thread not found");
    }

    // Create the new comment thread
    const commentThread = new Thread({
      text: { title: commentText },
      author: userId,
      parentId: threadId,
    });

    // Save the comment thread
    const savedCommentThread = await commentThread.save();

    // Add comment to original thread's children
    originalThread.children.push(savedCommentThread._id);

    // ✅ CREATE NOTIFICATION
    await Notification.insertOne({
      userId: originalThread.author, // ← Notify post author
      actorId: userId, // ← Commenter's ObjectId
      type: "comment",
      entityId: originalThread._id,
      read: false,
    });

    // Save updated thread
    await originalThread.save();

    try {
      const ably = new Ably.Rest(process.env.ABLY_API_KEY!);

      // 👇 Get THREAD AUTHOR (to send notification TO them)
      const threadAuthor = await User.findById(originalThread.author);
      if (!threadAuthor) {
        console.error("Thread author not found");
        return { success: false, message: "Thread author not found" };
      }

      // 👇 Get COMMENTER/ACTOR (the person who commented)
      const commenter = await User.findById(userId); // ← THIS WAS MISSING!
      if (!commenter) {
        console.error("Commenter user not found");
        return { success: false, message: "Commenter user not found" };
      }

      console.log(
        "Comment - Publishing to channel:",
        `user-${threadAuthor.id}`
      );
      console.log(
        "Comment - Thread author MongoDB ObjectId:",
        originalThread.author
      );
      console.log("Comment - Thread author Clerk ID:", threadAuthor.id);
      console.log("Comment - Commenter MongoDB ObjectId:", userId);
      console.log("Comment - Commenter Clerk ID:", commenter.id);

      await ably.channels
        .get(`user-${threadAuthor.id}`)
        .publish("new-notification", {
          title: "New Comment 💬",
        });

      console.log("Comment - Ably notification published successfully");
    } catch (error) {
      console.error("Comment - Failed to publish to Ably:", error);
      console.error("Comment - Error details:", error);
    }

    revalidatePath(path);

    return { success: true, message: "Comment added successfully" };
  } catch (err) {
    console.error("Error while adding comment:", err);
    throw new Error("Unable to add comment");
  }
}
export async function upvoteThread(threadId: string, userId: string) {
  try {
    await connectToDB();

    const thread: ThreadType | null = await Thread.findById(threadId);
    if (!thread) {
      return { success: false, message: "Thread not found" };
    }
    console.log("userID", userId);
    // Correct conversion

    const upvotes = thread.upvotes || [];

    const isUserExists = upvotes.some((id) => id === userId);

    // if (isUserExists) {
    //   return { success: false, message: "You can't vote again" };
    // }

    upvotes.push(userId);
    await Notification.insertOne({
      userId: thread.author,
      actorId: userId,
      type: "upvote",
      entityId: threadId,
      read: false,
    });

    thread.upvotes = upvotes;
    await thread.save();

    try {
      const ably = new Ably.Rest(process.env.ABLY_API_KEY!);

      // Get the thread author's Clerk user ID
      const threadAuthor = await User.findById(thread.author);
      if (!threadAuthor) {
        console.error("Thread author not found");
        return { success: false, message: "Thread author not found" };
      }

      const authorClerkId = threadAuthor.id; // This is the Clerk user ID
      const actor = await User.findById(userId);
      if (!actor) {
        console.error("Actor user not found");
        return { success: false, message: "Actor user not found" };
      }

      await ably.channels
        .get(`user-${authorClerkId}`)
        .publish("new-notification", {
          title: "New upvote ❤️",
        });

      console.log("Ably notification published successfully");
    } catch (error) {
      console.error("Failed to publish to Ably:", error);
      console.error("Error details:", error);
    }

    revalidatePath("/");

    return { success: true, message: "Upvote added successfully" };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Something went wrong" };
  }
}

export const repostThread = async (
  threadId: string,
  userId: string,
  communityId?: string
) => {
  await connectToDB();

  // 1. Find the thread being reshared
  const threadToShare = await Thread.findById(threadId).populate(
    "originalPost"
  );
  if (!threadToShare) throw new Error("Thread not found");

  // 2. Get original post: if it's already a share, use its original; else use itself
  const originalPostId = threadToShare.isShared
    ? threadToShare.originalPost || threadToShare._id
    : threadToShare._id;

  // 3. Find user & community
  const currentUser = await User.findById(userId).populate("communities");
  if (!currentUser) throw new Error("User not found");

  const community = communityId
    ? await Community.findOne({ id: communityId })
    : null;

  // 4. Create new thread for the repost
  const newThread = new Thread({
    text: threadToShare.text, // original content stays the same
    author: userId,
    community: community ? community._id : null,
    parentId: null, // reposts don't have a parent comment by default
    isShared: true,
    originalPost: originalPostId, // Always point to the original root post
    sharedBy: threadToShare.isShared
      ? [...(threadToShare.sharedBy || []), userId] // If resharing a share, extend chain
      : [userId], // First share creates array
    originalCommunity:
      threadToShare.originalCommunity || threadToShare.community,
  });

  // 5. Save new repost
  const savedThread = await newThread.save();

  // 6. Add to user’s threads list
  await User.findByIdAndUpdate(userId, { $push: { threads: savedThread._id } });

  // 7. Create notification for original post author
  const originalPost = await Thread.findById(originalPostId).populate({
    path: "author",
    model: User,
    select: "_id id name image",
  });

  if (originalPost && originalPost.author._id.toString() !== userId) {
    await Notification.insertOne({
      userId: originalPost.author._id,
      actorId: userId,
      type: "repost",
      entityId: originalPostId,
      read: false,
    });

    try {
      const ably = new Ably.Rest(process.env.ABLY_API_KEY!);

      const originalAuthor = originalPost.author;
      const reposter = await User.findById(userId);

      if (reposter) {
        console.log(
          "Repost - Publishing to channel:",
          `user-${originalAuthor.id}`
        );
        console.log("Repost - Original author Clerk ID:", originalAuthor.id);
        console.log("Repost - Reposter Clerk ID:", reposter.id);

        await ably.channels
          .get(`user-${originalAuthor.id}`)
          .publish("new-notification", {
            title: "New repost 🔄",
          });

        console.log("Repost - Ably notification published successfully");
      } else {
        console.error("Repost - Reposter not found");
      }
    } catch (error) {
      console.error("Repost - Failed to publish to Ably:", error);
    }
  }

  // 8. Revalidate feed
  revalidatePath("/");

  return savedThread;
};

export async function updateThread({ threadId, newText, path }: UpdateParams) {
  try {
    await connectToDB();
    console.log("New Text", newText);
    const thread = await Thread.findById(threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    // const result: any = await filterToxicComments(newText.title);
    // const classes = result?.moderation_classes;
    // if (!classes) {
    //   throw new Error("Moderation API did not return classes");
    // }

    // if (
    //   (classes.sexual ?? 0) > 0.1 ||
    //   (classes.violent ?? 0) > 0.1 ||
    //   (classes.toxic ?? 0) > 0.1
    // ) {
    //   return {
    //     message: "Your Thread contains sexual, violent, or toxic content!",
    //     status:201
    //   };
    // }

    thread.text = newText;
    await thread.save();

    revalidatePath(path);

    return { success: true, status: 200 };
  } catch (error: any) {
    throw new Error(`Failed to update thread: ${error.message}`);
  }
}
