"use server";

import { revalidatePath } from "next/cache";

import { connectToDB } from "../mongoose";

import User from "../models/user.model";
import Thread from "../models/thread.model";
import Community from "../models/community.model";
import { filterToxicComments } from "./filterThreads";
import { ObjectId, Document } from "mongoose";
import { extractMentions } from "@/constants";
import Notification from "../models/notification.model";
import Ably from "ably";

export const fetchPosts = async (pageNumber = 1, pageSize = 20) => {
  connectToDB();

  const skipAmount = (pageNumber - 1) * pageSize;

  const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
    .sort({ createdAt: "desc" })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({
      path: "author",
      model: User,
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
    })
    .populate({
      path: "originalCommunity",
      model: Community,
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
        select: "_id name parentId image",
      },
    })
    .lean();

  const totalPostsCount = await Thread.countDocuments({
    parentId: { $in: [null, undefined] },
  });

  const posts = await postsQuery.exec();
  const serializedPosts = JSON.parse(JSON.stringify(posts));

  const isNext = totalPostsCount > skipAmount + posts.length;

  return { posts: serializedPosts, isNext };
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
    connectToDB();

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
          userId, // ← Bob gets notified
          actorId: author, // ← Alice tagged Bob
          type: "mention",
          entityId: null, // ← We'll update after thread is created
          excerpt: text.title, // ← Preview text
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

    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id },
    });

    // 🏘️ Update community's threads list (if applicable)
    if (communityIdObject) {
      await Community.findByIdAndUpdate(communityIdObject, {
        $push: { threads: createdThread._id },
      });
    }

    // 🔄 Revalidate Next.js cache
    revalidatePath(path);

    return { success: true, status: 201 }; // 201 = Created
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
    connectToDB();

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
  connectToDB();

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
  connectToDB();

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
      parentId: threadId, // Set the parentId to the original thread's ID
    });

    // Save the comment thread to the database
    const savedCommentThread = await commentThread.save();

    // Add the comment thread's ID to the original thread's children array
    originalThread.children.push(savedCommentThread._id);

    await Notification.insertOne({
      userId: originalThread.author,
      actorId: userId,
      type: "comment",
      entityId: threadId,
      read: false,
    });

    // Save the updated original thread to the database
    await originalThread.save();

    revalidatePath(path);
  } catch (err) {
    console.error("Error while adding comment:", err);
    throw new Error("Unable to add comment");
  }
}
export async function upvoteThread(threadId: string, userId: string) {
  try {
    connectToDB();

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

      // Convert ObjectId to string for consistent channel naming
      const authorId = thread.author.toString();
      console.log("Publishing to channel:", `user-${authorId}`);
      console.log("Thread author ObjectId:", thread.author);
      console.log("Thread author as string:", authorId);
      console.log("Publishing notification data:", {
        title: "New upvote ❤️",
        excerpt: "Someone liked your post!",
        threadId: threadId,
        type: "upvote",
        actor: {
          id: userId,
        },
      });

      await ably.channels
        .get(`user-${authorId}`)
        .publish("new-notification", {
          title: "New upvote ❤️",
          excerpt: "Someone liked your post!",
          threadId: threadId,
          type: "upvote",
          actor: {
            id: userId,
            // Optional: Add name/image if you fetch User
          },
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

  // 7. Revalidate feed
  revalidatePath("/");

  return savedThread;
};

export async function updateThread({ threadId, newText, path }: UpdateParams) {
  try {
    connectToDB();
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
