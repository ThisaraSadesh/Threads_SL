import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import NotificationContainer from "./NotificationContainer";
import { markAsRead } from "@/lib/actions/notification.actions";

export function NotificationBell({ notifications }: any) {
  const handleClickNotification = async (id, read) => {
    "use server";
    if (!read) {
      await markAsRead(id);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>
          <img src={"/assets/notif.svg"} width={15} height={15} alt="bellImg" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-100 bg-black">
        <NotificationContainer
          notifications={notifications}
          handleClickNotification={handleClickNotification}
        />
      </PopoverContent>
    </Popover>
  );
}
