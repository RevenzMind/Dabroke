import {

isPermissionGranted,
requestPermission,
sendNotification,
} from '@tauri-apps/plugin-notification';

export interface NotificationOptions {
title: string;
body: string;
icon?: string;
}

export class NotificationHandler {
private static permissionGranted: boolean | null = null;

private static async checkPermission(): Promise<boolean> {
    if (this.permissionGranted === null) {
        this.permissionGranted = await isPermissionGranted();
        
        if (!this.permissionGranted) {
            const permission = await requestPermission();
            this.permissionGranted = permission === 'granted';
        }
    }
    
    return this.permissionGranted;
}

static async send(options: NotificationOptions): Promise<boolean> {
    const canSend = await this.checkPermission();
    
    if (canSend) {
        sendNotification({
            title: options.title,
            body: options.body,
            icon: options.icon,
        });
        return true;
    }
    
    return false;
}
}