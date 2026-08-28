"use client";

import React, { useEffect, useState } from "react";

interface FormattedDateProps {
  date: Date | string;
  prefix?: string;
  className?: string;
}

export function FormattedDate({ date, prefix = "", className }: FormattedDateProps) {
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    try {
      const d = new Date(date);
      setFormatted(
        d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch {
      setFormatted(String(date));
    }
  }, [date]);

  // Stable SSR / initial hydration string (UTC based, deterministic across server and client)
  const ssrDate = (() => {
    try {
      const d = new Date(date);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
    } catch {
      return "";
    }
  })();

  return (
    <span className={className} suppressHydrationWarning>
      {prefix}
      {formatted || ssrDate}
    </span>
  );
}
