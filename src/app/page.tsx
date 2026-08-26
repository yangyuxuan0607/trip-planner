import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { TripWorkspace } from "@/components/trip/TripWorkspace";
import { getServerLocale } from "@/lib/i18n/getServerLocale";
import { dictionaries } from "@/lib/i18n/dictionaries";

const publicUserSelect = { id: true, name: true, avatarText: true, color: true } as const;

export default async function HomePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const trip = await prisma.trip.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      members: { include: { user: { select: publicUserSelect } } },
      days: {
        orderBy: { date: "asc" },
        include: {
          items: { include: { createdBy: { select: publicUserSelect } } },
        },
      },
      polls: {
        orderBy: { createdAt: "asc" },
        include: {
          options: {
            orderBy: { order: "asc" },
            include: { votes: { include: { user: { select: publicUserSelect } } } },
          },
        },
      },
      expenses: {
        orderBy: { date: "asc" },
        include: {
          paidBy: { select: publicUserSelect },
          createdBy: { select: publicUserSelect },
          participants: { include: { user: { select: publicUserSelect } } },
          item: { select: { id: true } },
        },
      },
      logs: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { user: { select: publicUserSelect } },
      },
    },
  });

  if (!trip) {
    const locale = await getServerLocale();
    const t = dictionaries[locale];
    const [before, after] = t.emptyStateNoTripHint.split("{cmd}");
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-medium">{t.emptyStateNoTrip}</p>
        <p className="text-xs text-muted-foreground">
          {before}
          <code className="rounded bg-secondary px-1 py-0.5 font-mono">npm run db:seed</code>
          {after}
        </p>
      </main>
    );
  }

  const members = trip.members.map((m) => m.user);

  return (
    <TripWorkspace
      trip={trip}
      days={trip.days}
      polls={trip.polls}
      members={members}
      currentUser={currentUser}
      expenses={trip.expenses}
      logs={trip.logs}
    />
  );
}
