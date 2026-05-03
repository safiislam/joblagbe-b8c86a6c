import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches dynamic import / chunk load failures (common after a new deploy
 * when the previously-hashed JS chunks no longer exist on the CDN).
 * Auto-reloads the page once so the user gets the new build instead of a
 * blank white screen.
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    const message = (error as Error)?.message ?? "";
    const name = (error as Error)?.name ?? "";
    const isChunkError =
      /Loading chunk [\d]+ failed/i.test(message) ||
      /Loading CSS chunk/i.test(message) ||
      /Failed to fetch dynamically imported module/i.test(message) ||
      /Importing a module script failed/i.test(message) ||
      name === "ChunkLoadError";

    if (isChunkError && typeof window !== "undefined") {
      const KEY = "__chunk_reload_at";
      const last = Number(sessionStorage.getItem(KEY) ?? "0");
      const now = Date.now();
      // Only auto-reload once per minute to avoid infinite loops.
      if (now - last > 60_000) {
        sessionStorage.setItem(KEY, String(now));
        window.location.reload();
        return { hasError: true };
      }
    }
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[ChunkErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
            <p className="text-base text-foreground">
              পেজ লোড হতে সমস্যা হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন।
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              রিলোড করুন
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export default ChunkErrorBoundary;