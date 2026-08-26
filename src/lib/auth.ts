import "server-only";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";

export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

/** 拿目前登入的使用者，沒登入就丟錯（server action 裡用來擋未登入寫入） */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("未登入");
  return user;
}
