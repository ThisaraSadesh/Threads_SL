import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import NotificationContainer from "./NotificationContainer";
import { markAsRead } from "@/lib/actions/notification.actions";
import NotificationCount from "./NotificationCount";

export function NotificationBell({ notifications }: any) {
  const handleClickNotification = async (id, read) => {
    "use server";
    if (!read) {
      await markAsRead(id);
    }
  };

  const filterUnreadNotifications = notifications.filter(
    (not: any) => not.read === false
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="rounded-full">
          <div className="flex items-center text-subtle-medium">
            <img
              src={"/assets/notif.svg"}
              width={15}
              height={15}
              alt="bellImg"
            />
            <NotificationCount filterUnreadNotifications={filterUnreadNotifications}/>
          </div>
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
