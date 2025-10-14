import { inngest } from "@/app/inngest/client";
import Thread from "@/lib/models/thread.model";
import connectToDB from "@/lib/mongoose";

export const publishScheduledThreads = inngest.createFunction(
  { id: "publish-scheduled-threads" },
  { cron: "*/1 * * * *" }, // Every minute — just like your node-cron!
  async ({ step }) => {
    await step.run("Connect to DB", async () => {
      await connectToDB();
    });

    const now = new Date();

    const threadsToPublish = await step.run(
      "Find threads to publish",
      async () => {
        return await Thread.find({
          status: "scheduled",
          scheduledAt: { $lte: now },
        });
      }
    );

    if (threadsToPublish.length === 0) {
      console.log("No threads to publish");
      return;
    }

    await Promise.all(
      threadsToPublish.map(async (threadData) => {
        await step.run(`Publish thread ${threadData._id}`, async () => {
          try {
            const thread = await Thread.findById(threadData._id);
            if (!thread)
              return console.log("Thread not found:", threadData._id);

            thread.status = "published";
            thread.createdAt = now;
            await thread.save();

            console.log(`✅ Published thread: ${thread._id}`);
          } catch (err) {
            console.error(
              `❌ Failed to publish thread ${threadData._id}:`,
              err
            );
            await Thread.findByIdAndUpdate(threadData._id, {
              status: "failed",
            });
          }
        });
      })
    );
  }
);
