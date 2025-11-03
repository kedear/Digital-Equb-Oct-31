
import React from 'react';
import { Notification } from '../types';
import { NotificationIcon, XIcon } from './Icons';

interface NotificationPanelProps {
    notifications: Notification[];
    onClose: () => void;
}

const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
};


export const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onClose }) => {
    
    // FIX: Property 'date' does not exist on type 'Notification'. The correct property is 'created_at'.
    const sortedNotifications = [...notifications].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div className="absolute top-12 right-0 w-80 bg-light-card dark:bg-brand-card border border-light-border dark:border-brand-border rounded-lg shadow-lg z-50">
            <div className="flex justify-between items-center p-3 border-b border-light-border dark:border-brand-border">
                <h3 className="font-semibold text-lg">Notifications</h3>
                <button onClick={onClose} aria-label="Close notifications"><XIcon className="w-5 h-5"/></button>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {sortedNotifications.length > 0 ? (
                    sortedNotifications.map(notification => (
                        <div key={notification.id} className="p-3 border-b border-light-border dark:border-brand-border last:border-b-0 hover:bg-light-bg dark:hover:bg-brand-dark">
                            <p className="text-sm">{notification.message}</p>
                            {/* FIX: Property 'date' does not exist on type 'Notification'. The correct property is 'created_at'. */}
                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">{formatRelativeTime(notification.created_at)}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 px-4">
                        <NotificationIcon className="w-12 h-12 text-light-text-secondary dark:text-dark-text-secondary mx-auto mb-2"/>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">You're all caught up!</p>
                    </div>
                )}
            </div>
        </div>
    );
};