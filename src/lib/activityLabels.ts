import type { ActivityAction } from "@prisma/client";
import type { DictKey } from "@/lib/i18n/dictionaries";

export const ACTIVITY_ACTION_LABEL_KEYS: Record<ActivityAction, DictKey> = {
  LOGIN: "activityLoginAt",
  ITEM_CREATE: "activityItemCreate",
  ITEM_UPDATE: "activityItemUpdate",
  ITEM_DELETE: "activityItemDelete",
  ITEM_REORDER: "activityItemReorder",
  POLL_CREATE: "activityPollCreate",
  POLL_UPDATE: "activityPollUpdate",
  POLL_DELETE: "activityPollDelete",
  VOTE_CAST: "activityVoteCast",
  EXPENSE_CREATE: "activityExpenseCreate",
  EXPENSE_UPDATE: "activityExpenseUpdate",
  EXPENSE_DELETE: "activityExpenseDelete",
  IMPORT_BULK: "activityImportBulk",
};
