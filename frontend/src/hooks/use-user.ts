"use client";

import { useState, useEffect } from "react";

// TODO: Replace this stub with the actual user session hook/context from your auth setup.
// Expected to fetch real `name` and `email` from the backend/session.

interface UserSession {
  name: string;
  email: string;
  isLoading: boolean;
}

export function useUser(): UserSession {
  // Simulating an async fetch of the user session
  const [session, setSession] = useState<UserSession>({
    name: "",
    email: "",
    isLoading: true,
  });

  useEffect(() => {
    // Simulated delay for auth check
    const timer = setTimeout(() => {
      setSession({
        name: "Hitesh Lalwani",
        email: "hitesh@email.com",
        isLoading: false,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return session;
}
