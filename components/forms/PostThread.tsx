"use client";

import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ThreadValidation } from "@/lib/validations/thread";
import { createThread, updateThread } from "@/lib/actions/thread.actions";
import z from "zod";
import { useOrganization } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Textarea } from "../ui/textarea";
import GifPicker, { TenorImage } from "gif-picker-react";

interface tweetFormProps {
  userId: string | undefined;
  data?: {
    title: string;
    images: string[];
    threadId: string;
  };
  isEditing?: boolean;
  setIsEditing?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TweetForm({
  userId,
  data,
  isEditing,
  setIsEditing,
}: tweetFormProps) {
  const form = useForm({
    defaultValues: {
      tweet: data?.title || "",
      image: [] as File[],
    },
  });

  const [preview, setPreview] = useState<string[]>(data?.images || []);
  const { organization } = useOrganization();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGif, setSelectedGif] = useState([]);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: any
  ) => {
    const newFiles = e.target.files ? Array.from(e.target.files) : [];

    const allFiles = [...(field.value || []), ...newFiles];
    field.onChange(allFiles);

    if (allFiles.length > 0) {
      const previews = await Promise.all(
        allFiles.map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            })
        )
      );
      setPreview([...preview, ...previews]);
    } else {
      setPreview([]);
    }
    e.target.value = "";
  };
  const handleGifClick = async (gif: TenorImage) => {
    const url = gif.url;
    setSelectedGif([...selectedGif, url]);
    console.log("gif Selected", gif.url);
    setPreview([...preview, url]);
  };

const onSubmit = async (values: z.infer<typeof ThreadValidation>) => {
  setLoading(true); // Start loading

  let imageUrls: string[] = [...(data?.images || selectedGif || [])];

  // Upload images if any
  if (values.image && values.image.length > 0) {
    try {
      for (const file of values.image) {
        const formData = new FormData();
        formData.set("file", file);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        try {
          const uploadRequest = await fetch("/api/pinata", {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const signedUrl = await uploadRequest.json();
          imageUrls.push(signedUrl);
        } catch (error: any) {
          clearTimeout(timeoutId);
          if (error.name === "AbortError") {
            toast.error("Upload timed out. Try smaller files.");
          } else {
            toast.error("Image upload failed: " + error.message);
          }
          setLoading(false); // ✅ Reset on upload error
          return;
        }
      }
    } catch (error: any) {
      toast.error("Image processing failed: " + error.message);
      setLoading(false); // ✅ Reset on unexpected error
      return;
    }
  }

  const textData = {
    title: values.tweet,
    images: imageUrls,
  };

  try {
    let result;

    if (!isEditing) {
      result = await createThread({
        text: textData,
        author: userId,
        communityId: organization ? organization.id : null,
        path: pathname,
      });
    } else {
      result = await updateThread({
        threadId: data?.threadId,
        newText: textData,
        path: pathname,
      });
    }

    if (result?.success) {
      toast.success(isEditing ? "Thread updated!" : "Thread posted!");

      // ✅ Reset form and state
      setPreview([]);
      form.reset();

      // ✅ Exit editing mode if applicable
      if (isEditing && setIsEditing) {
        setIsEditing(false);
      }

      // ✅ Optional: Redirect or refresh
      // router.refresh(); or router.push(...)
    } else {
      toast.warning(result.message || "Something went wrong.");
    }
  } catch (error) {
    console.error("💥 Thread action failed:", error);
    toast.error("Failed to post thread. Please try again.");
  } finally {
    // ✅ ALWAYS turn off loading — success, failure, exception
    setLoading(false);
  }
};
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="tweet"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tweet</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="What's happening?"
                  {...field}
                  className="text-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="space-y-4 w-full">
                  {/* Control Bar: Icons + Button */}
                  <div className="flex items-center justify-between gap-3">
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileChange(e, field)}
                      className="hidden"
                      ref={field.ref}
                    />

                    {/* Left: Trigger buttons */}
                    <div className="flex items-center gap-2">
                      <div
                        className="cursor-pointer rounded-lg p-2 h-[40px] w-[40px] flex items-center justify-center bg-muted hover:bg-accent transition"
                        onClick={() =>
                          document.getElementById("image-upload")?.click()
                        }
                      >
                        <img
                          src="/assets/imagelogo.svg"
                          alt="Upload Image"
                          width={24}
                          height={24}
                          className="w-full h-full"
                        />
                      </div>

                      <div
                        className="cursor-pointer rounded-lg p-2 h-[40px] w-[40px] flex items-center justify-center bg-muted hover:bg-accent transition"
                        onClick={() => setShowGifPicker(true)}
                      >
                        <img
                          src="/assets/gif.svg"
                          alt="Add GIF"
                          width={24}
                          height={24}
                          className="w-full h-full"
                        />
                      </div>
                    </div>

                    {/* Right: Submit Button */}
                    <Button type="submit" disabled={loading}>
                      {loading ? "Uploading..." : "Post"}
                    </Button>
                  </div>

                  {/* Preview Thumbnails — Rendered BELOW control bar */}
                  {preview.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {preview.map((prv, idx) => (
                        <img
                          key={idx}
                          src={prv}
                          alt={`Preview ${idx}`}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded border"
                        />
                      ))}
                    </div>
                  )}

                  {showGifPicker && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                  
                      <div className="relative w-fit flex flex-col items-end justify-center bg-transparent">
                  
                        <button
                          onClick={() => setShowGifPicker(false)}
                          className=" text-white text-4xl"
                        >
                          
                          ✕
                        </button>
                        <GifPicker
                          tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY!}
                          onGifClick={handleGifClick}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
