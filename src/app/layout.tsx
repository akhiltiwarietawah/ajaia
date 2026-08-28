import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { getDemoUserById } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Ajaia Docs | AI-Native Collaborative Document Editor",
  description: "A lightweight collaborative document editor inspired by Google Docs, built with Next.js and Tiptap.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const activeUserId = cookieStore.get("ajaia_active_user")?.value;
  const initialUser = getDemoUserById(activeUserId);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <UserProvider initialUser={initialUser}>{children}</UserProvider>
      </body>
    </html>
  );
}
