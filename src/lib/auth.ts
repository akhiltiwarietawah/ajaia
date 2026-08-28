import { DemoUser } from "@/types";

export const DEMO_USERS: DemoUser[] = [
  {
    id: "user_alice",
    name: "Alice Johnson",
    email: "alice@ajaia.demo",
    avatar: "bg-emerald-600",
  },
  {
    id: "user_bob",
    name: "Bob Smith",
    email: "bob@ajaia.demo",
    avatar: "bg-blue-600",
  },
  {
    id: "user_charlie",
    name: "Charlie Davis",
    email: "charlie@ajaia.demo",
    avatar: "bg-purple-600",
  },
];

export const DEFAULT_USER = DEMO_USERS[0]; // Alice Johnson

export function getDemoUserById(id?: string | null): DemoUser {
  if (!id) return DEFAULT_USER;
  const user = DEMO_USERS.find((u) => u.id === id);
  return user || DEFAULT_USER;
}

export function getDemoUserByEmail(email?: string | null): DemoUser | undefined {
  if (!email) return undefined;
  return DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
