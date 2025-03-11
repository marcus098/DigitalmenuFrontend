import React, { useEffect } from 'react';
import { useNotification } from "../Context/NotificationContext";

const NotificationDisplay: React.FC = () => {
    const { notifications, removeNotification } = useNotification();

    useEffect(() => {
        // Set up timers for all notifications
        notifications.forEach((_, index) => {
            setTimeout(() => removeNotification(index), 6000); // 6000 milliseconds = 6 seconds
        });
    }, [notifications, removeNotification]);

    return (
        <div className="fixed top-0 right-0 p-6 space-y-4 z-50">
            {notifications.map((notification, index) => (
                <div
                    key={index}
                    className={`transition-transform transform p-4 rounded-md shadow-lg text-white max-w-xs w-full ${
                        notification.type === 'success'
                            ? 'bg-green-500'
                            : notification.type === 'error'
                                ? 'bg-red-500'
                                : notification.type === 'info'
                                    ? 'bg-blue-500'
                                    : 'bg-yellow-500'
                    }`}
                    style={{
                        animation: 'fadeIn 0.5s ease-out',
                        transition: 'transform 0.3s ease, opacity 0.3s ease',
                    }}
                >
                    <div className="flex justify-between">
                        <span>{notification.message}</span>
                        {/* Optionally you can add a close button */}
                        <button
                            onClick={() => removeNotification(index)}
                            className="ml-4 text-white hover:text-gray-200"
                        >
                            &#10005;
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NotificationDisplay;
