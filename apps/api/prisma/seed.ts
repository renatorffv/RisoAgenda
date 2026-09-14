import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  const professional = await prisma.user.upsert({
    where: { email: "profissional@risoagenda.com" },
    update: {},
    create: {
      name: "Ana Souza",
      email: "profissional@risoagenda.com",
      passwordHash,
      role: "PROFISSIONAL",
      phone: "(11) 90000-0000",
    },
  });

  const client = await prisma.user.upsert({
    where: { email: "cliente@risoagenda.com" },
    update: {},
    create: {
      name: "Bia Lima",
      email: "cliente@risoagenda.com",
      passwordHash,
      role: "CLIENTE",
      phone: "(11) 98888-0000",
    },
  });

  const existingServices = await prisma.service.count({ where: { professionalId: professional.id } });
  if (existingServices === 0) {
    await prisma.service.createMany({
      data: [
        {
          professionalId: professional.id,
          name: "Manicure",
          description: "Cuidado completo das unhas das mãos, com esmaltação.",
          durationMinutes: 60,
          price: 35,
        },
        {
          professionalId: professional.id,
          name: "Pedicure",
          description: "Cuidado completo das unhas dos pés, com esmaltação.",
          durationMinutes: 60,
          price: 40,
        },
        {
          professionalId: professional.id,
          name: "Manicure e Pedicure",
          description: "Combo completo de mãos e pés.",
          durationMinutes: 120,
          price: 70,
        },
      ],
    });
  }

  const existingAvailability = await prisma.weeklyAvailability.count({
    where: { professionalId: professional.id },
  });
  if (existingAvailability === 0) {
    await prisma.weeklyAvailability.createMany({
      data: [1, 2, 3, 4, 5].map((weekday) => ({
        professionalId: professional.id,
        weekday,
        startTime: "09:00",
        endTime: "18:00",
      })),
    });
  }

  console.log("Seed concluído.");
  console.log(`Profissional: ${professional.email} / senha: 123456`);
  console.log(`Cliente: ${client.email} / senha: 123456`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
