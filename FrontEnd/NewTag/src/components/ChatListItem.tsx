import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ChatListItemProps {
  id: string;
  userName: string;
  userImage: string;
  productImage: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isActive?: boolean;
  onClick?: () => void;
}

export function ChatListItem({
  userName,
  userImage,
  productImage,
  lastMessage,
  lastMessageTime,
  unreadCount,
  isActive = false,
  onClick
}: ChatListItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 border-b p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
        isActive ? 'bg-muted/30' : ''
      }`}
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={userImage} />
          <AvatarFallback>{userName[0]}</AvatarFallback>
        </Avatar>
        {unreadCount > 0 && (
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-white">
            {unreadCount}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={unreadCount > 0 ? '' : 'text-muted-foreground'}>
            {userName}
          </span>
          <span className="text-xs text-muted-foreground">{lastMessageTime}</span>
        </div>
        <p className={`truncate text-sm ${unreadCount > 0 ? '' : 'text-muted-foreground'}`}>
          {lastMessage}
        </p>
      </div>

      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border">
        <ImageWithFallback
          src={productImage}
          alt="Product"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
