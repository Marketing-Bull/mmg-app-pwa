"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Comment, RoleId } from "./types";

const STORAGE_KEY = "mmg-app-v1";

export interface Profile {
  name: string;
  email: string;
  phone: string;
  company: string;
  role: RoleId;
}

export interface Rsvp extends Profile {
  slug: string;
  guests: number;
  createdAt: string;
}

export interface SponsorInquiry {
  tierId: string;
  tierName: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  createdAt: string;
}

interface StoreState {
  profile: Profile | null;
  rsvps: Record<string, Rsvp>;
  /** Keyed by `event:<slug>` or `thread:<id>`. */
  comments: Record<string, Comment[]>;
  saved: string[];
  inquiries: SponsorInquiry[];
}

const EMPTY: StoreState = { profile: null, rsvps: {}, comments: {}, saved: [], inquiries: [] };

interface StoreValue extends StoreState {
  /** False until localStorage has been read, so SSR and first paint agree. */
  hydrated: boolean;
  addRsvp: (rsvp: Rsvp) => void;
  cancelRsvp: (slug: string) => void;
  hasRsvp: (slug: string) => boolean;
  addComment: (key: string, comment: Comment) => void;
  toggleSaved: (slug: string) => void;
  isSaved: (slug: string) => boolean;
  addInquiry: (inquiry: SponsorInquiry) => void;
  setProfile: (profile: Profile) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function readStorage(): StoreState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<StoreState>;
    return {
      profile: parsed.profile ?? null,
      rsvps: parsed.rsvps ?? {},
      comments: parsed.comments ?? {},
      saved: parsed.saved ?? [],
      inquiries: parsed.inquiries ?? [],
    };
  } catch {
    // Corrupt or unavailable storage (private mode, quota) — start clean
    // rather than taking the whole app down.
    return EMPTY;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    setState(readStorage());
    hydratedRef.current = true;
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Skip the initial render so we never overwrite saved state with EMPTY.
    if (!hydratedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked — the session still works, it just won't persist.
    }
  }, [state]);

  const addRsvp = useCallback((rsvp: Rsvp) => {
    setState((prev) => ({
      ...prev,
      rsvps: { ...prev.rsvps, [rsvp.slug]: rsvp },
      profile: {
        name: rsvp.name,
        email: rsvp.email,
        phone: rsvp.phone,
        company: rsvp.company,
        role: rsvp.role,
      },
    }));
  }, []);

  const cancelRsvp = useCallback((slug: string) => {
    setState((prev) => {
      const next = { ...prev.rsvps };
      delete next[slug];
      return { ...prev, rsvps: next };
    });
  }, []);

  const addComment = useCallback((key: string, comment: Comment) => {
    setState((prev) => ({
      ...prev,
      comments: { ...prev.comments, [key]: [...(prev.comments[key] ?? []), comment] },
    }));
  }, []);

  const toggleSaved = useCallback((slug: string) => {
    setState((prev) => ({
      ...prev,
      saved: prev.saved.includes(slug)
        ? prev.saved.filter((s) => s !== slug)
        : [...prev.saved, slug],
    }));
  }, []);

  const addInquiry = useCallback((inquiry: SponsorInquiry) => {
    setState((prev) => ({
      ...prev,
      inquiries: [...prev.inquiries, inquiry],
      profile: prev.profile ?? {
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        company: inquiry.company,
        role: "sponsor",
      },
    }));
  }, []);

  const setProfile = useCallback((profile: Profile) => {
    setState((prev) => ({ ...prev, profile }));
  }, []);

  const resetDemo = useCallback(() => {
    setState(EMPTY);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to clean up */
    }
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      hydrated,
      addRsvp,
      cancelRsvp,
      hasRsvp: (slug) => Boolean(state.rsvps[slug]),
      addComment,
      toggleSaved,
      isSaved: (slug) => state.saved.includes(slug),
      addInquiry,
      setProfile,
      resetDemo,
    }),
    [
      state,
      hydrated,
      addRsvp,
      cancelRsvp,
      addComment,
      toggleSaved,
      addInquiry,
      setProfile,
      resetDemo,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside <StoreProvider>");
  return context;
}
