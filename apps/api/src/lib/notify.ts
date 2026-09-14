import type { NotificationType } from "@risoagenda/shared";
import { prisma } from "./prisma";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  content: string;
  relatedId?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      content: params.content,
      relatedId: params.relatedId,
    },
  });
}
