import type { User } from "@supabase/supabase-js";
import { signOut } from "@/app/components/user-actions";

interface UserMenuProps {
  user: User | null;
}

export default function UserMenu({ user }: UserMenuProps) {
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <p className="max-w-[140px] truncate text-xs font-medium text-[var(--muted)] sm:max-w-none">{user.email}</p>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-lg border-2 border-black bg-white px-3 py-1 text-sm font-semibold"
        >
          Logout
        </button>
      </form>
    </div>
  );
}
