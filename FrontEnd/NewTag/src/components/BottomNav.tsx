import { Home, TrendingUp, PlusCircle, MessageCircle, User } from "lucide-react";

console.log('[BottomNav] Component file loaded at:', new Date().toLocaleTimeString());

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  console.log('[BottomNav] Component rendered, currentPage:', currentPage);
  const navItems = [
    { id: 'home', label: '홈', icon: Home },
    { id: 'resell', label: '리셀', icon: TrendingUp },
    { id: 'register', label: '판매하기', icon: PlusCircle },
    { id: 'chat', label: '채팅', icon: MessageCircle },
    { id: 'mypage', label: '나의 거래', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] border-t bg-background">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[BottomNav Button] Clicked:', item.id, item.label);
                onNavigate(item.id);
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors pointer-events-auto ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
              style={{ position: 'relative', zIndex: 10000 }}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
