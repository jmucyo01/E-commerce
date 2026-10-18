"use client";

import type { CSSProperties, ReactNode } from "react";

export function ConfirmSubmitButton({
  action,
  message,
  children,
  className,
  style,
}: {
  action: () => Promise<void>;
  message: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      <button type="submit" className={className} style={style}>
        {children}
      </button>
    </form>
  );
}