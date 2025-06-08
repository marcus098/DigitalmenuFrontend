import React, { createContext, useContext, useState } from 'react';

interface Notification {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: Notification) => void;
    removeNotification: (index: number) => void;
}

// Usa React.PropsWithChildren per includere children nel tipo
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = (notification: Notification) => {
        setNotifications((prev) => [...prev, notification]);
        console.log(notification)
    };

    const removeNotification = (index: number) => {
        setNotifications((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
