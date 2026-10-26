"use client";

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { LocaleProvider } from "@/context/LocaleContext";
import { AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  // Suppress errors injected by third-party browser extensions (like Urban VPN executors/200.js)
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      const isExtension =
        event.filename?.includes("chrome-extension://") ||
        event.error?.stack?.includes("chrome-extension://") ||
        event.message?.includes("M_ID") ||
        event.error?.stack?.includes("executors/200.js");

      if (isExtension) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const reasonStr = String(event.reason?.stack || event.reason || "");
      if (reasonStr.includes("chrome-extension://") || reasonStr.includes("M_ID")) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener("error", errorHandler, true);
    window.addEventListener("unhandledrejection", unhandledRejectionHandler, true);

    return () => {
      window.removeEventListener("error", errorHandler, true);
      window.removeEventListener("unhandledrejection", unhandledRejectionHandler, true);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <AuthProvider>{children}</AuthProvider>
        <Toaster theme="dark" richColors position="top-right" />
      </LocaleProvider>
    </QueryClientProvider>
  );
}
