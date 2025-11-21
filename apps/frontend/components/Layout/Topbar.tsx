"use client";

import Image from "next/image";
import { useUserStore } from "../../store/userStore";

type User = {
  name: string;
  avatarUrl: string;
};

export default function Topbar() {
  const { user } = useUserStore() as { user: User | null };

  return (
    <div className="w-full border-b bg-white p-4 flex justify-end">
      {user && (
        <div className="flex items-center gap-3">
          <Image
            src={user.avatarUrl}
            alt={`${user.name}'s avatar`}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
          <span>{user.name}</span>
        </div>
      )}
    </div>
  );
}
