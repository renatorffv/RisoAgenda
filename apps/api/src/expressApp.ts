import express from "express";
import cors from "cors";
import { env } from "./lib/env";
import { authRouter } from "./routes/auth";
import { servicesRouter } from "./routes/services";
import { availabilityRouter } from "./routes/availability";
import { appointmentsRouter } from "./routes/appointments";
import { messagesRouter } from "./routes/messages";
import { notificationsRouter } from "./routes/notifications";
import { professionalsRouter } from "./routes/professionals";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "risoagenda-api" }));

app.get("/__debug", (req, res) =>
  res.json({ url: req.url, originalUrl: req.originalUrl, path: req.path, baseUrl: req.baseUrl })
);

app.use("/auth", authRouter);
app.use("/services", servicesRouter);
app.use("/availability", availabilityRouter);
app.use("/appointments", appointmentsRouter);
app.use("/messages", messagesRouter);
app.use("/notifications", notificationsRouter);
app.use("/professionals", professionalsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
