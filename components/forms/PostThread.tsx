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
} from "@/components/ui/form"; // adjust path as needed
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
      image: [] as File[], // ✅ multiple files
    },
  });

  const [preview, setPreview] = useState<string[]>(data?.images || []);
  const { organization } = useOrganization();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: any
  ) => {
    const newFiles = e.target.files ? Array.from(e.target.files) : [];

    // Merge with existing files in the form field
    const allFiles = [...(field.value || []), ...newFiles];
    field.onChange(allFiles);

    // Generate previews for all files
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

  const onSubmit = async (values: z.infer<typeof ThreadValidation>) => {
    setLoading(true);

    let imageUrls: string[] = [...(data?.images || [])];

    let signedUrl;

    if (values.image && values.image.length > 0) {
      try {
        for (const file of values.image) {
          const data = new FormData();
          data.set("file", file);

          const uploadRequest = await fetch("/api/pinata", {
            method: "POST",
            body: data,
          });

          signedUrl = await uploadRequest.json();
          imageUrls.push(signedUrl); // ✅ Collect URLs for all files
        }
      } catch (error: any) {
        toast.error("Image upload failed: " + error.message);
        return;
      }
    }

    const textData = {
      title: values.tweet,
      images: imageUrls,
    };

    console.log(
      "📡 [CHECKPOINT 5] Preparing to call createThread with:",
      textData
    );

    try {
      console.log("⚙️ [CHECKPOINT 6] Executing createThread...");
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
        if (isEditing) {
          setLoading(false);
          setIsEditing(false);
          toast.success("Thread posted!");
        }
      } else {
        toast.warning(result.message);
        console.warn("⚠️ Thread rejected:", result.message);
      }
      setPreview([]);
      form.reset();
    } catch (error) {
      console.error("💥 [CHECKPOINT 9] createThread threw error:", error);
      toast.error("Failed to post thread. Check console.");
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Tweet Textarea Field */}
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

        {/* Image Upload Field */}
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center justify-between gap-3 ">
                  {" "}
                  {/* 👈 Wrapper div to avoid React.Fragment prop error */}
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileChange(e, field)} // pass full field
                    className="hidden"
                    ref={field.ref}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {preview.map((prv, idx) => (
                      <img
                        key={idx}
                        src={prv}
                        alt={`Preview ${idx}`}
                        className="w-24 h-24 object-cover rounded border"
                      />
                    ))}
                  </div>
                  <div
                    onClick={() =>
                      document.getElementById("image-upload")?.click()
                    }
                    className="cursor-pointer rounded-lg p-4 h-[50px] w-[50px] flex items-center justify-center"
                  >
                    <img
                      src="/assets/imagelogo.svg"
                      alt="imageLogo"
                      width={30}
                      height={30}
                      className="w-full h-full"
                    />
                  </div>
                  <Button type="submit">
                    {loading ? "Loading..." : "Upload"}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
      </form>
    </Form>
  );
}
