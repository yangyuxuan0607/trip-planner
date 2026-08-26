import { prisma } from "@/lib/db";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoginPageHeader } from "@/components/auth/LoginPageHeader";

export default async function LoginPage() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, avatarText: true, color: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col items-center justify-center gap-8 px-6 py-10">
      <LoginPageHeader />
      <LoginForm users={users} />
    </main>
  );
}
