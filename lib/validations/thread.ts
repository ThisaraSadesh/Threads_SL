import * as z from "zod";

export const ThreadValidation = z.object({
  tweet: z
    .string()
    .min(3, { message: "Tweet must be at least 3 characters." })
    .max(500, { message: "Tweet must be less than 500 characters." }),
  image: z
    .array(z.instanceof(File))
    .optional()
    .refine((files) => !files || files.length <= 5, {
      message: "You can upload up to 5 images only.",
    }),
});
export const CommentValidation = z.object({
  thread: z.string().nonempty().min(3, { message: "minimum 3 characters" }),
});
