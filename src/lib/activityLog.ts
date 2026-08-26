import "server-only";
import { prisma } from "@/lib/db";
import type { ActivityAction } from "@prisma/client";

export async function writeLog(params: {
  tripId: string;
  userId: string;
  action: ActivityAction;
  targetType: string;
  targetName: string;
  summary: string;
}) {
  await prisma.activityLog.create({ data: params });
}
