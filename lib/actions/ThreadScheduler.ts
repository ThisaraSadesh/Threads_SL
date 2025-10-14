// lib/scheduler.ts
import cron from 'node-cron';
import Thread from '../models/thread.model';
import connectToDB from '../mongoose';

export const startScheduler = () => {
  cron.schedule('* * * * *', async () => { 
    console.log('Running scheduled thread publisher...');
    try {
      await connectToDB();

      const now = new Date();
      const threadsToPublish = await Thread.find({
        status: 'scheduled',
        scheduledAt: { $lte: now }
      });

      for (const thread of threadsToPublish) {
        try {
          thread.status = 'published';
          thread.postedAt = now;
          await thread.save();

          console.log(`Published thread: ${thread._id}`);
        } catch (err) {
          console.error(`Failed to publish thread ${thread._id}:`, err);
          thread.status = 'failed';
          await thread.save();
        }
      }
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  });
};