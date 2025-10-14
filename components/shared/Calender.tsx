"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { combineDateTime } from "@/lib/utils";

export function Calendar24({ setScheduleTime }) {
  const [open, setOpen] = React.useState(false);
  const [selectedDate, setDate] = React.useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [mainOpen, setMainOpen] = React.useState(false);

  return (
    <div className="flex gap-4 items-center justify-center">
      <div className="flex flex-col">
        <Popover open={mainOpen} onOpenChange={setMainOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              Schedule Post
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-auto p-4 flex flex-col gap-3"
            align="start"
          >
            <div className="flex items-center gap-2">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" id="date-picker" className="w-32">
                    {selectedDate
                      ? selectedDate.toLocaleDateString()
                      : "Select date"}
                    <ChevronDownIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    captionLayout="dropdown"
                    onSelect={(selectedDate) => {
                      setDate(selectedDate);
                      setCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Input */}
            <div className="flex items-center gap-2">
              <Input
                type="time"
                id="time-picker"
                step="1"
                defaultValue="10:30"
                className="w-32"
              />
            </div>

            {/* Optional: Confirm Button */}
            <Button
              onClick={() => {
                const timeInput = document.getElementById(
                  "time-picker"
                ) as HTMLInputElement;
                const time = timeInput?.value || "10:30";
                const date = selectedDate;
                const scheduledDateTime = combineDateTime(date, time);
                setScheduleTime(scheduledDateTime);

                console.log("Scheduled for:", date, time);
                setMainOpen(false); // Close main popover
              }}
              className="mt-2"
            >
              Schedule
            </Button>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col "></div>
    </div>
  );
}
