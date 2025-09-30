import { writable } from "svelte/store";

export interface Notification {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

export const notifications = writable<Notification[]>([]);

export function addNotification(notification: Omit<Notification, "id">) {
  const id = Math.random().toString(36).substr(2, 9);
  const newNotification: Notification = {
    id,
    ...notification,
  };

  notifications.update((current) => [...current, newNotification]);

  return id;
}

export function removeNotification(id: string) {
  notifications.update((current) => current.filter((n) => n.id !== id));
}

export function clearNotifications() {
  notifications.set([]);
}

// Convenience functions
export function showSuccess(message: string, duration = 4000) {
  return addNotification({ message, type: "success", duration });
}

export function showError(message: string, duration = 5000) {
  return addNotification({ message, type: "error", duration });
}

export function showWarning(message: string, duration = 4000) {
  return addNotification({ message, type: "warning", duration });
}

export function showInfo(message: string, duration = 4000) {
  return addNotification({ message, type: "info", duration });
}
