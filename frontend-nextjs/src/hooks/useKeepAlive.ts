"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores";

const API_URL =
  (typeof window !== "undefined" &&
    (window as any).__ENV__?.NEXT_PUBLIC_API_URL) ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

/**
 * Keep-alive hook to prevent Render free tier server from sleeping
 * Pings the server every 10 minutes
 */
export function useKeepAlive() {
  const { token, isAuthenticated } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run keep-alive if user is authenticated
    if (!isAuthenticated || !token) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Ping server every 10 minutes (600000 ms)
    // Render free tier sleeps after 15 minutes of inactivity
    const pingInterval = 10 * 60 * 1000;

    const pingServer = async () => {
      try {
        const response = await fetch(`${API_URL}/health`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          console.log("✓ Keep-alive ping successful");
        }
      } catch (error) {
        console.log("✗ Keep-alive ping failed (server may be waking up)");
      }
    };

    // Initial ping
    pingServer();

    // Set up interval
    intervalRef.current = setInterval(pingServer, pingInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [token, isAuthenticated]);
}
