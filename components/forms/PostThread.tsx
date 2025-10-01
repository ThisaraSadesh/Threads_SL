"use client";

import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { ThreadValidation } from "@/lib/validations/thread";
import { createThread, updateThread } from "@/lib/actions/thread.actions";
import z from "zod";
import { useOrganization } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Textarea } from "../ui/textarea";
import GifPicker, { TenorImage } from "gif-picker-react";
import { Input } from "@/components/ui/input";
import { searchUsers } from "@/lib/actions/user.actions"; // ✅ Your server action
import { Switch } from "../ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TweetFormProps {
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
}: TweetFormProps) {
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

  // 💡 Mention State
  const [text, setText] = useState(data?.title || ""); // Sync with form
  const [showPopup, setShowPopup] = useState(false);
  const [query, setQuery] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(data?.title || "");
  }, [data?.title]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestedUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingUsers(true);
      try {
        const results = await searchUsers(query);
        setSuggestedUsers(results || []);
      } catch (err) {
        console.error("Failed to search users:", err);
        setSuggestedUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

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
      setPreview((prev) => [...prev, ...previews]);
    }
    e.target.value = "";
  };

  const handleGifClick = (gif: TenorImage) => {
    const url = gif.url;
    setPreview((prev) => [...prev, url]);
    setShowGifPicker(false);
  };

  const onSubmit = async (values: z.infer<typeof ThreadValidation>) => {
    setLoading(true);

    let imageUrls: string[] = [...(data?.images || [])];

    // Upload new images
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
            setLoading(false);
            return;
          }
        }
      } catch (error: any) {
        toast.error("Image processing failed: " + error.message);
        setLoading(false);
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
          focusMode:isFocusMode
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
        setPreview([]);
        form.reset();
        if (isEditing && setIsEditing) setIsEditing(false);
        // router.refresh(); // optional
      } else {
        toast.warning(result.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("💥 Thread action failed:", error);
      toast.error("Failed to post thread. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const insertMention = (username: string) => {
    // Recalculate from current state — don't rely on possibly stale values
    const currentText = text;
    const currentCursor = textareaRef.current?.selectionStart || cursorPos;

    // Find the LAST @ before cursor (in case state drifted)
    const lastAt = currentText.lastIndexOf("@", currentCursor - 1);

    if (lastAt === -1) {
      // Safety fallback — just append at end
      const newText = `${currentText}@${username} `;
      setText(newText);
      form.setValue("tweet", newText, { shouldValidate: true });
      setShowPopup(false);
      setQuery("");
      return;
    }

    // Calculate how much to cut out
    const queryStart = lastAt + 1;
    const queryEnd = currentCursor;
    const before = currentText.slice(0, lastAt); // everything before "@"
    const after = currentText.slice(queryEnd); // everything after cursor

    const newText = `${before}@${username} ${after}`;

    setText(newText);
    form.setValue("tweet", newText, { shouldValidate: true });
    setShowPopup(false);
    setQuery("");

    // Refocus & reposition cursor AFTER inserted mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = lastAt + username.length + 2; // +2 for '@' and space
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  useEffect(() => {
    const handleClickOutside = () => setShowPopup(false);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* TWEET FIELD WITH MENTIONS */}
        <FormField
          control={form.control}
          name="tweet"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tweet</FormLabel>
              <FormControl>
                <div style={{ position: "relative" }}>
                  <Textarea
                    {...field}
                    ref={(e) => {
                      textareaRef.current = e;
                      if (typeof field.ref === "function") field.ref(e);
                      else if (field.ref) field.ref.current = e;
                    }}
                    value={text}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      const cursorPosition = e.target.selectionStart || 0;

                      setText(newValue);
                      field.onChange(e); // Keep RHF in sync

                      // Detect @
                      if (
                        newValue[cursorPosition - 1] === "@" &&
                        newValue[cursorPosition - 2] !== "\\"
                      ) {
                        setShowPopup(true);
                        setQuery("");
                        setCursorPos(cursorPosition);
                      } else if (showPopup) {
                        const lastAt = newValue.lastIndexOf(
                          "@",
                          cursorPosition - 1
                        );
                        if (lastAt !== -1) {
                          const currentQuery = newValue.slice(
                            lastAt + 1,
                            cursorPosition
                          );

                          // ✅ ONLY update query if it's valid (no spaces, not empty)
                          if (
                            currentQuery.length > 0 &&
                            !currentQuery.includes(" ")
                          ) {
                            setQuery(currentQuery);
                            setCaretPosition(cursorPosition); // 👈 Also update caret position here!
                          } else {
                            setShowPopup(false);
                          }
                        } else {
                          setShowPopup(false);
                        }
                      }
                    }}
                    placeholder="What's happening? Type @ to mention someone..."
                    rows={3}
                    className="text-white"
                  />

                  {/* 👇 MENTION POPUP */}
                  {showPopup && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        backgroundColor: "#1f2937",
                        border: "1px solid #4b5563",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        zIndex: 1000,
                        width: "100%",
                        maxHeight: "180px",
                        overflowY: "auto",
                        fontSize: "14px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isLoadingUsers ? (
                        <div
                          style={{
                            padding: "10px",
                            color: "#9ca3af",
                            textAlign: "center",
                          }}
                        >
                          Searching...
                        </div>
                      ) : suggestedUsers.length > 0 ? (
                        suggestedUsers.map((user) => (
                          <div
                            key={user._id}
                            onClick={() => insertMention(user.username)}
                            onMouseDown={(e) => e.preventDefault()}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "10px 12px",
                              cursor: "pointer",
                              borderBottom: "1px solid #374151",
                            }}
                          >
                            {user.image && (
                              <img
                                src={user.image}
                                alt=""
                                width="24"
                                height="24"
                                style={{
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                }}
                              />
                            )}
                            <div>
                              <div>
                                <strong className="text-white">
                                  @{user.username}
                                </strong>
                              </div>
                              <div
                                style={{ fontSize: "12px", color: "#9ca3af" }}
                              >
                                {user.name}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div
                          style={{
                            padding: "10px",
                            color: "#9ca3af",
                            textAlign: "center",
                          }}
                        >
                          No users found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* IMAGE / GIF UPLOAD */}
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="space-y-4 w-full">
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

                    <div className="flex items-center gap-2">
                      <div
                        className="cursor-pointer rounded-lg p-2  flex items-center justify-center  hover:bg-accent transition"
                        onClick={() =>
                          document.getElementById("image-upload")?.click()
                        }
                      >
                        <img
                          src="/assets/media.svg"
                          alt="Upload Image"
                          width={24}
                          height={24}
                          className=" w-[24px] h-[24px]"
                        />
                      </div>

                      <div
                        className="cursor-pointer rounded-lg p-2  flex items-center justify-center  hover:bg-accent transition"
                        onClick={() => setShowGifPicker(true)}
                      >
                        <img
                          src="/assets/gif.svg"
                          alt="Add GIF"
                          width={24}
                          height={24}
                          className="w-[24px] h-[24px]"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 items-center justify-center">
                      <span className="text-white text-base-regular">
                        Focus Mode
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div onClick={(e) => e.preventDefault()}>
                            <Switch
                              checked={isFocusMode}
                              onCheckedChange={setIsFocusMode} // ShadCN uses this prop
                              onPointerDown={(e) => e.preventDefault()}
                            />{" "}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="line-clamp-4 text-base-regular">
                            Turn on Focus Mode to create space for deeper
                            thinking. Your thread will auto-hide after 24 hours
                            or when replies exceed 100 limit.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Posting..." : isEditing ? "Update" : "Post"}
                      </Button>
                    </div>
                  </div>

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
                          className="text-white text-4xl mb-2"
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
