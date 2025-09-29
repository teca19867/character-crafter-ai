
import React from 'react';
import { Notification } from '../types.ts';

interface NotificationCenterProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const notificationStyles = {
  success: 'bg-green-500/80 border-green-400',
  error: 'bg-red-500/80 border-red-400',
  info: 'bg-blue-500/80 border-blue-400',
  warning: 'bg-yellow-500/80 border-yellow-400',
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-5 right-5 z-50 w-full max-w-sm space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`relative rounded-lg p-4 text-white border backdrop-blur-md ${notificationStyles[notification.type]} animate-fade-in-right`}
        >
          <p className="pr-6">{notification.message}</p>
          <button
            onClick={() => onDismiss(notification.id)}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};

// Add keyframes for animation in a style tag for simplicity, as we can't use external CSS files.
const styles = `
@keyframes fade-in-right {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.animate-fade-in-right {
  animation: fade-in-right 0.3s ease-out forwards;
}
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);