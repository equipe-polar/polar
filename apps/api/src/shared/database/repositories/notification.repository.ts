import type { DatabaseClient } from "../database.js";
import type { Notification } from "../../domain.js";

export interface NotificationRepository {
  list(): Promise<Notification[]>;
  create(notification: Notification): Promise<Notification>;
}

export class JsonNotificationRepository implements NotificationRepository {
  constructor(private readonly db: DatabaseClient) {}

  async list(): Promise<Notification[]> {
    const state = await this.db.read();
    return state.notifications;
  }

  async create(notification: Notification): Promise<Notification> {
    return this.db.transaction((state) => {
      state.notifications.push(notification);
      return notification;
    });
  }
}
