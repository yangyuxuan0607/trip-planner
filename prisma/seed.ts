import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SEED_USERS } from "../src/lib/config/users";
import { splitEvenly } from "../src/lib/money";
import { TRIP_META, MALAYSIA_TRIP_DAYS, type LocalizedText } from "./seedData";

const prisma = new PrismaClient();

function d(dateOnly: string) {
  return new Date(`${dateOnly}T00:00:00Z`);
}

function loc<F extends string>(field: F, value: LocalizedText) {
  return {
    [`${field}Zh`]: value.zh || null,
    [`${field}En`]: value.en || null,
    [`${field}Ja`]: value.ja || null,
  } as Record<`${F}Zh` | `${F}En` | `${F}Ja`, string | null>;
}

async function main() {
  console.log("Seeding users...");
  const users = await Promise.all(
    SEED_USERS.map((u) =>
      prisma.user.upsert({
        where: { id: u.id },
        update: { name: u.name, avatarText: u.avatarText, color: u.color, pinHash: bcrypt.hashSync(u.pin, 10) },
        create: {
          id: u.id,
          name: u.name,
          avatarText: u.avatarText,
          color: u.color,
          pinHash: bcrypt.hashSync(u.pin, 10),
        },
      }),
    ),
  );
  const [me, a, b] = users;
  const rotation = [me, a, b];

  const existingTrip = await prisma.trip.findFirst();
  if (existingTrip) {
    console.log("Trip data already exists, skipping trip/day/item/poll/expense seed.");
    return;
  }

  console.log("Seeding trip...");
  const trip = await prisma.trip.create({
    data: {
      nameZh: TRIP_META.name.zh,
      nameEn: TRIP_META.name.en,
      nameJa: TRIP_META.name.ja,
      destinationZh: TRIP_META.destination.zh,
      destinationEn: TRIP_META.destination.en,
      destinationJa: TRIP_META.destination.ja,
      currency: TRIP_META.currency,
      startDate: d(TRIP_META.startDate),
      endDate: d(TRIP_META.endDate),
      members: { create: users.map((u) => ({ userId: u.id })) },
    },
  });

  console.log("Seeding days & itinerary items...");
  const dayIdByDate = new Map<string, string>();
  let creatorIndex = 0;

  for (const [dayIndex, seedDay] of MALAYSIA_TRIP_DAYS.entries()) {
    const day = await prisma.day.create({
      data: { tripId: trip.id, date: d(seedDay.date), order: dayIndex, ...loc("title", seedDay.title) },
    });
    dayIdByDate.set(seedDay.date, day.id);

    for (const [itemIndex, seedItem] of seedDay.items.entries()) {
      const creator = rotation[creatorIndex % rotation.length];
      creatorIndex++;
      await prisma.itineraryItem.create({
        data: {
          dayId: day.id,
          startTime: seedItem.startTime,
          endTime: seedItem.endTime,
          category: seedItem.category,
          cost: seedItem.cost,
          url: seedItem.url,
          order: itemIndex,
          createdById: creator.id,
          ...loc("title", seedItem.title),
          ...loc("locationName", seedItem.locationName ?? { zh: "", en: "", ja: "" }),
          ...loc("note", seedItem.note ?? { zh: "", en: "", ja: "" }),
        },
      });
    }
  }

  console.log("Seeding poll...");
  const penangDayId = dayIdByDate.get("2026-10-27");
  const poll = await prisma.poll.create({
    data: {
      tripId: trip.id,
      dayId: penangDayId,
      createdById: me.id,
      ...loc("question", { zh: "槟城吃什麼？", en: "What to eat in Penang?", ja: "ペナンで何を食べる？" }),
      options: {
        create: [
          {
            order: 0,
            ...loc("label", { zh: "亚参叻沙", en: "Assam Laksa", ja: "アッサムラクサ" }),
            ...loc("note", { zh: "酸辣魚湯米粉", en: "Tangy, spicy fish-broth noodles", ja: "酸味と辛味の魚だし麺" }),
          },
          {
            order: 1,
            ...loc("label", { zh: "炒粿条", en: "Char Kway Teow", ja: "チャークイティオ" }),
            ...loc("note", { zh: "槟城经典炒河粉", en: "Penang's classic fried flat noodles", ja: "ペナンの定番焼きビーフン麺" }),
          },
          {
            order: 2,
            ...loc("label", { zh: "福建面", en: "Hokkien Mee", ja: "福建麺" }),
            ...loc("note", { zh: "虾面汤头浓郁", en: "Rich prawn-broth noodle soup", ja: "濃厚なエビだしの麺" }),
          },
        ],
      },
    },
    include: { options: true },
  });
  await prisma.vote.create({ data: { pollId: poll.id, pollOptionId: poll.options[0].id, userId: me.id } });
  await prisma.vote.create({ data: { pollId: poll.id, pollOptionId: poll.options[1].id, userId: a.id } });

  console.log("Seeding expenses...");
  async function createExpense(opts: {
    date: string;
    title: LocalizedText;
    category: "TRANSPORT" | "SIGHT" | "FOOD" | "LODGING" | "SHOPPING" | "FREE" | "OTHER";
    amount: number;
    paidById: string;
    createdById: string;
    participantIds: string[];
    note?: string;
  }) {
    const shares = splitEvenly(opts.amount, opts.participantIds);
    return prisma.expense.create({
      data: {
        tripId: trip.id,
        date: d(opts.date),
        category: opts.category,
        amount: opts.amount,
        currency: trip.currency,
        paidById: opts.paidById,
        createdById: opts.createdById,
        note: opts.note,
        ...loc("title", opts.title),
        participants: {
          create: opts.participantIds.map((userId) => ({ userId, shareAmount: shares[userId] })),
        },
      },
    });
  }

  await createExpense({
    date: "2026-10-24",
    title: { zh: "马六甲住宿（1晚）", en: "Melaka accommodation (1 night)", ja: "マラッカの宿泊費（1泊）" },
    category: "LODGING",
    amount: 400,
    paidById: me.id,
    createdById: me.id,
    participantIds: [me.id, a.id, b.id],
  });
  await createExpense({
    date: "2026-10-25",
    title: { zh: "马六甲→怡保巴士", en: "Melaka → Ipoh coach", ja: "マラッカ→イポー バス" },
    category: "TRANSPORT",
    amount: 165,
    paidById: a.id,
    createdById: a.id,
    participantIds: [me.id, a.id, b.id],
  });
  await createExpense({
    date: "2026-10-26",
    title: { zh: "怡保→槟城 火车+渡轮", en: "Ipoh → Penang train + ferry", ja: "イポー→ペナン 鉄道+フェリー" },
    category: "TRANSPORT",
    amount: 106,
    paidById: b.id,
    createdById: b.id,
    participantIds: [me.id, a.id, b.id],
  });
  await createExpense({
    date: "2026-10-26",
    title: { zh: "槟城住宿（2晚）", en: "Penang accommodation (2 nights)", ja: "ペナンの宿泊費（2泊）" },
    category: "LODGING",
    amount: 1000,
    paidById: me.id,
    createdById: me.id,
    participantIds: [me.id, a.id, b.id],
  });
  await createExpense({
    date: "2026-10-27",
    title: { zh: "槟城美食巡礼", en: "Penang food circuit", ja: "ペナン食べ歩き" },
    category: "FOOD",
    amount: 245,
    paidById: a.id,
    createdById: a.id,
    participantIds: [me.id, a.id, b.id],
  });
  await createExpense({
    date: "2026-10-28",
    title: { zh: "吉隆坡住宿（4晚）", en: "Kuala Lumpur accommodation (4 nights)", ja: "クアラルンプールの宿泊費（4泊）" },
    category: "LODGING",
    amount: 1700,
    paidById: b.id,
    createdById: b.id,
    participantIds: [me.id, a.id, b.id],
  });
  await createExpense({
    date: "2026-10-31",
    title: { zh: "巴生肉骨茶", en: "Klang bak kut teh", ja: "クランのバクテー" },
    category: "FOOD",
    amount: 90,
    paidById: me.id,
    createdById: me.id,
    participantIds: [me.id, a.id],
    note: "B 沒有一起去",
  });

  console.log("Seeding activity log...");
  await prisma.activityLog.createMany({
    data: [
      { tripId: trip.id, userId: me.id, action: "ITEM_CREATE", targetType: "ItineraryItem", targetName: "直达巴士前往马六甲", summary: "新增了一筆交通行程" },
      { tripId: trip.id, userId: a.id, action: "ITEM_CREATE", targetType: "ItineraryItem", targetName: "入住怡保民宿", summary: "新增了一筆住宿行程" },
      { tripId: trip.id, userId: me.id, action: "POLL_CREATE", targetType: "Poll", targetName: "槟城吃什麼？", summary: "建立了投票，3 個選項" },
      { tripId: trip.id, userId: a.id, action: "VOTE_CAST", targetType: "Poll", targetName: "槟城吃什麼？", summary: "投給了「炒粿条」" },
      { tripId: trip.id, userId: b.id, action: "EXPENSE_CREATE", targetType: "Expense", targetName: "吉隆坡住宿（4晚）", summary: "新增支出 RM1,700" },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
