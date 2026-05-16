import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { signOut } from "@/app/components/user-actions";
import Image from "next/image";

interface UserMenuProps {
  user: User | null;
  avatarUrl: string | null;
}

export default function UserMenu({ user, avatarUrl }: UserMenuProps) {
  if (!user) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-white text-[var(--muted)]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/perfil" aria-label="Mi perfil">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="User avatar"
            width={32}
            height={32}
            className="rounded-full border-2 border-black object-cover hover:opacity-80 transition-opacity"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-[var(--accent)] text-black hover:opacity-80 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-lg border-2 border-black bg-white px-3 py-1 text-sm font-semibold"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
