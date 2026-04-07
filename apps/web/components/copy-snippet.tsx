"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type CopySnippetProps = {
  title: string;
  value: string;
  description?: string;
};

export function CopySnippet({
  title,
  value,
  description,
}: CopySnippetProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-4 backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
            {title}
          </p>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
              {description}
            </p>
          ) : null}
        </div>
        <Button variant="outline" onClick={handleCopy}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="mt-4 overflow-x-auto rounded-[20px] bg-[var(--popover)] p-4 font-mono text-sm leading-7 text-[var(--foreground)]">
        <code>{value}</code>
      </pre>
    </div>
  );
}
