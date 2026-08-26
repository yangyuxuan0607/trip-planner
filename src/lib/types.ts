import type {
  ItineraryItem,
  Day,
  Poll,
  PollOption,
  Vote,
  Expense,
  ExpenseParticipant,
  User,
  ActivityLog,
  Trip,
} from "@prisma/client";

export type TripRecord = Trip;

export type PublicUser = Pick<User, "id" | "name" | "avatarText" | "color">;

export type ItemWithCreator = ItineraryItem & { createdBy: PublicUser };
export type DayWithItems = Day & { items: ItemWithCreator[] };

export type VoteWithUser = Vote & { user: PublicUser };
export type PollOptionWithVotes = PollOption & { votes: VoteWithUser[] };
export type PollWithOptions = Poll & { options: PollOptionWithVotes[] };

export type ExpenseParticipantWithUser = ExpenseParticipant & { user: PublicUser };
export type ExpenseWithDetails = Expense & {
  paidBy: PublicUser;
  createdBy: PublicUser;
  participants: ExpenseParticipantWithUser[];
  item: { id: string } | null;
};

export type ActivityLogWithUser = ActivityLog & { user: PublicUser };

export type DayOption = { id: string; date: Date; titleZh: string | null; titleEn: string | null; titleJa: string | null };
