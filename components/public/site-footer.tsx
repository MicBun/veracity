import Link from "next/link";
import { GitHubMark } from "@/components/public/brand";
import { RepoLink } from "@/components/public/private-repo-link";

const linkCls =
  "underline underline-offset-2 transition-colors hover:text-stone-700 dark:hover:text-stone-200";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 dark:border-stone-700">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 text-xs text-stone-500 dark:text-stone-400 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Amanah — a working product demo. All campaigns are fictional; the AI
          pipeline and audit trail are real.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/about" className={linkCls}>
            How it works
          </Link>
          <RepoLink href="https://github.com/MicBun/amanah" className={linkCls}>
            Code on GitHub
          </RepoLink>
          <span aria-hidden className="text-stone-300 dark:text-stone-600">
            ·
          </span>
          <span>
            Built by{" "}
            <a
              href="https://micbun.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-stone-600 underline underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100"
            >
              Michael Buntarman
            </a>
          </span>
          <a
            href="https://github.com/MicBun"
            target="_blank"
            rel="noreferrer"
            aria-label="Michael Buntarman on GitHub"
            className="transition-colors hover:text-stone-700 dark:hover:text-stone-200"
          >
            <GitHubMark className="size-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
