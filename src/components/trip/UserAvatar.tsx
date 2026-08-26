import { cn } from "@/lib/utils";

type AvatarUser = { name: string; avatarText: string; color: string };

const SIZES = {
  xs: "size-5 text-[10px]",
  sm: "size-7 text-xs",
  md: "size-9 text-sm",
  lg: "size-14 text-lg",
};

export function UserAvatar({
  user,
  size = "sm",
  className,
}: {
  user: AvatarUser;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      title={user.name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white ring-1 ring-black/5",
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: user.color }}
    >
      {user.avatarText.slice(0, 2)}
    </span>
  );
}
