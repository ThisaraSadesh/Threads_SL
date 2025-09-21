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
    setLoading(true);
    console.log("selected Gifs", selectedGif);
    let imageUrls: string[] = [...(data?.images || []), ...selectedGif];

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
        if (isEditing) {
          setLoading(true);

          result = await updateThread({
            threadId: data?.threadId,
            newText: textData,
            path: pathname,
          });

          if (result?.success) {
            toast.success("Thread updated!");

            setTimeout(() => {
              setLoading(false);
              setIsEditing(false);
            }, 5000);
          } else {
            setLoading(false);
            toast.warning(result.message);
          }
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
                <div className="flex items-center justify-between gap-3 ">
                  {" "}
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileChange(e, field)}
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
                  <div className="cursor-pointer gap-2 rounded-lg p-4 h-[50px] w-[50px] flex items-center justify-center">
                    <img
                      src="/assets/imagelogo.svg"
                      alt="imageLogo"
                      width={30}
                      height={30}
                      className="w-full h-full"
                      onClick={() =>
                        document.getElementById("image-upload")?.click()
                      }
                    />
                    <img
                      src="/assets/gif.svg"
                      alt="imageLogo"
                      width={30}
                      height={30}
                      className="w-full h-full"
                      onClick={() => setShowGifPicker(true)}
                    />
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
                  <Button type="submit">
                    {loading ? "Loading..." : "Upload"}
                  </Button>
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
