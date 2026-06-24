"use client";

import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * The Veracity repo is private for now. Every link that points into it renders as
 * a non-navigating hint instead of a button that 404s for anyone without access.
 *
 * When the repo goes public, flip REPO_PUBLIC to true — every RepoLink becomes a
 * normal anchor again, no other edits needed.
 */
export const REPO_PUBLIC = false;

const ACCESS_HINT = "Private repo — contact me for access";

export function RepoLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  if (REPO_PUBLIC) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="link"
            aria-disabled="true"
            aria-label={ACCESS_HINT}
            tabIndex={0}
            className={cn(className, "cursor-help")}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent>{ACCESS_HINT}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
