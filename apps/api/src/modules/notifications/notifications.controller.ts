import type { Request, Response } from "express";
import type { Services } from "../../shared/services.js";
import { createNotificationSchema } from "./notifications.types.js";

export class NotificationsController {
  constructor(private readonly services: Services) {}

  list = async (_req: Request, res: Response): Promise<Response> => {
    return res.json({ data: await this.services.notifications.list() });
  };

  create = async (req: Request, res: Response): Promise<Response> => {
    const body = createNotificationSchema.parse(req.body);
    const notification = await this.services.notifications.create(body, req.usuario?.id ?? "sistema");
    return res.status(201).json({ data: notification });
  };
}
