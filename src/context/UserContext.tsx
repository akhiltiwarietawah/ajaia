"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DemoUser } from "@/types";
import { DEFAULT_USER, DEMO_USERS } from "@/lib/auth";

interface UserContextType {
  currentUser: DemoUser;
  setCurrentUser: (user: DemoUser) => void;
  switchUser: (userId: string) => void;
  allUsers: DemoUser[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
  children,
  initialUser = DEFAULT_USER,
}: {
  children: React.ReactNode;
  initialUser?: DemoUser;
}) {
  const [currentUser, setCurrentUserState] = useState<DemoUser>(initialUser);

  // Synchronize state if initialUser prop updates from server navigation
  useEffect(() => {
    if (initialUser && initialUser.id !== currentUser.id) {
      setCurrentUserState(initialUser);
    }
  }, [initialUser?.id]);

  const setCurrentUser = (user: DemoUser) => {
    setCurrentUserState(user);
    try {
      localStorage.setItem("ajaia_active_user_id", user.id);
      document.cookie = `ajaia_active_user=${user.id}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {
      console.warn("Failed to persist user in storage", e);
    }
  };

  const switchUser = (userId: string) => {
    const user = DEMO_USERS.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchUser,
        allUsers: DEMO_USERS,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useCurrentUser must be used within a UserProvider");
  }
  return context;
}
