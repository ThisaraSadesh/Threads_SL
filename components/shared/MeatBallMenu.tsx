"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeatBallDropdownItems } from "@/constants";
import { deleteThread } from "@/lib/actions/thread.actions";
import { toast } from "sonner";

export function MeatBallMenu({ setIsEditing, id }) {
  const handleDeleteThread = async (ThreadId: any) => {
    const result = await deleteThread(ThreadId, "/");
    if (result?.success) {
      toast.success("Thread Deleted Successfully");
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="bg-white">
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {MeatBallDropdownItems.map((item) => (
          <>
            <DropdownMenuItem
              key={item.id}
              onClick={
                item.value === "Edit"
                  ? () => setIsEditing(true)
                  : () => handleDeleteThread(id)
              }
              className={`
    ${
      item.value === "Delete"
        ? "hover:bg-red-500 !hover:text-white !bg-red-500/80"
        : "hover:bg-gray-500"
    }
    text-small-regular cursor-pointer
  `}
            >
              {item.value}
            </DropdownMenuItem>
          </>
        ))}

        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
