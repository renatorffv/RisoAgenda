import { Router } from "express";
import { sendMessageSchema, UserRole } from "@risoagenda/shared";
import type { ConversationDTO } from "@risoagenda/shared";
import { prisma } from "../lib/prisma";
import { AppError, NotFoundError, asyncHandler } from "../lib/errors";
import { serializeMessage, serializeUser } from "../lib/serialize";
import { requireAuth } from "../middleware/auth";
import { createNotification } from "../lib/notify";

export const messagesRouter = Router();

messagesRouter.use(requireAuth);

messagesRouter.get(
  "/conversations",
  asyncHandler(async (req, res) => {
    const me = req.user!.id;
    const isProfessional = req.user!.role === UserRole.PROFISSIONAL;

    const appointmentContacts = await prisma.appointment.findMany({
      where: isProfessional ? { professionalId: me } : { clientId: me },
      select: { professionalId: true, clientId: true },
    });
    const appointmentContactIds = appointmentContacts.map((a) =>
      isProfessional ? a.clientId : a.professionalId
    );

    const messageContacts = await prisma.message.findMany({
      where: { OR: [{ senderId: me }, { receiverId: me }] },
      select: { senderId: true, receiverId: true },
    });
    const messageContactIds = messageContacts.map((m) => (m.senderId === me ? m.receiverId : m.senderId));

    const contactIds = Array.from(new Set([...appointmentContactIds, ...messageContactIds]));

    const conversations: ConversationDTO[] = await Promise.all(
      contactIds.map(async (contactId) => {
        const contact = await prisma.user.findUnique({ where: { id: contactId } });
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: me, receiverId: contactId },
              { senderId: contactId, receiverId: me },
            ],
          },
          orderBy: { createdAt: "desc" },
        });
        const unreadCount = await prisma.message.count({
          where: { senderId: contactId, receiverId: me, read: false },
        });

        return {
          contact: serializeUser(contact!),
          lastMessage: lastMessage ? serializeMessage(lastMessage) : undefined,
          unreadCount,
        };
      })
    );

    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ?? "";
      const bTime = b.lastMessage?.createdAt ?? "";
      return bTime.localeCompare(aTime);
    });

    res.json(conversations);
  })
);

messagesRouter.get(
  "/:contactId",
  asyncHandler(async (req, res) => {
    const me = req.user!.id;
    const contactId = req.params.contactId;

    const contact = await prisma.user.findUnique({ where: { id: contactId } });
    if (!contact) throw new NotFoundError("Contato não encontrado");

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: me, receiverId: contactId },
          { senderId: contactId, receiverId: me },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    await prisma.message.updateMany({
      where: { senderId: contactId, receiverId: me, read: false },
      data: { read: true },
    });

    res.json(messages.map(serializeMessage));
  })
);

messagesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = sendMessageSchema.parse(req.body);

    if (data.receiverId === req.user!.id) {
      throw new AppError("Não é possível enviar mensagem para si mesmo", 400);
    }

    const receiver = await prisma.user.findUnique({ where: { id: data.receiverId } });
    if (!receiver) throw new NotFoundError("Destinatário não encontrado");

    const message = await prisma.message.create({
      data: { senderId: req.user!.id, receiverId: data.receiverId, content: data.content },
    });

    await createNotification({
      userId: data.receiverId,
      type: "NOVA_MENSAGEM",
      content: `${req.user!.name}: ${data.content.slice(0, 80)}`,
      relatedId: req.user!.id,
    });

    res.status(201).json(serializeMessage(message));
  })
);
