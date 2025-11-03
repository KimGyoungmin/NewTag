import React from 'react';
import { ChevronLeft, Bell } from 'lucide-react';

interface Notification {
  id: number;
  message: string;
  time: string;
  isRead: boolean;
}

interface NotificationsPageProps {
  notifications: Notification[];
  setCurrentScreen: (screen: string) => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ notifications, setCurrentScreen }) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 flex items-center gap-2">
        <ChevronLeft className="w-6 h-6 cursor-pointer" onClick={() => setCurrentScreen('mypage')} />
        <h1 className="text-lg font-bold">알림</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Bell className="w-16 h-16 mb-4" />
            <div>알림이 없습니다</div>
          </div>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className={`p-4 border-b ${notif.isRead ? 'bg-white' : 'bg-yellow-50'}`}>
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <div className="text-sm text-gray-800 mb-1">{notif.message}</div>
                  <div className="text-xs text-gray-500">{notif.time}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
