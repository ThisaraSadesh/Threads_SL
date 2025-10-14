import { serve } from "inngest/next";
import { inngest } from "@/app/inngest/client";
import { publishScheduledThreads } from "@/app/inngest/functions";

// Create an API that serves all required functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [publishScheduledThreads],
});
