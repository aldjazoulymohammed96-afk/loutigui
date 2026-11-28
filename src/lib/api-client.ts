"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lightweight client-side query cache (SWR-like) with request de-duplication.
 *
 * - The same endpoint requested by several components/pages is fetched only once.
 * - Cached data is rendered instantly on navigation, then revalidated in the
 *   background when it is older than `ttl`.
 * - `clearQueryCache()` is called by `triggerRefresh()` after a mutation so the
 *   next render fetches fresh data.
 */

type Selector<T> = (json: unknown) => T;

interface CacheEntry<T = unknown> {
  data?: T;
  updatedAt: number;
  promise?: Promise<T>;
}

const cache = new Map<string, CacheEntry>();

export function getQueryData<T>(key: string): T | undefined {
  return cache.get(key)?.data as T | undefined;
}

export function setQueryData<T>(key: string, data: T): void {
  cache.set(key, { data, updatedAt: Date.now() });
}

export function clearQueryCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of Array.from(cache.keys())) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

/**
 * Read an API response as JSON without crashing the UI when the platform
 * answers with an HTML error page (WAF 403, 503, expired deployment...).
 * Returns a stable French message instead of "Unexpected token '<'".
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- payloads are validated per API route
export async function readApiJson<T = any>(res: Response): Promise<T> {
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("application/json")) {
    throw new Error(
      res.ok
        ? "Réponse inattendue du serveur."
        : `Service momentanément indisponible (${res.status}). Réessayez plus tard.`
    );
  }
  const json = await res.json().catch(() => null);
  if (json === null) {
    throw new Error(`Réponse invalide du serveur (${res.status}).`);
  }
  return json as T;
}

function defaultSelect(json: unknown): unknown {
  if (json && typeof json === "object" && "data" in json) {
    return (json as { data: unknown }).data;
  }
  return json;
}

async function fetchQuery<T>(
  key: string,
  url: string,
  select: Selector<T> | undefined,
  ttl: number,
  force = false
): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!force && entry?.data !== undefined && now - entry.updatedAt < ttl) {
    return entry.data;
  }
  if (entry?.promise) {
    return entry.promise;
  }

  const promise = fetch(url, { cache: "no-store" })
    .then(async (res) => {
      if (res.status === 401 && typeof window !== "undefined") {
        cache.clear();
        const path = window.location.pathname;
        const isPublic = [
          "/login",
          "/signup",
          "/landing",
          "/verify",
          "/forgot-password",
          "/reset-password",
        ].some((prefix) => path.startsWith(prefix));
        if (!isPublic) {
          // Full reload is intentional here: cached queries are cleared above.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign("/login");
        }
      }

      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: string; data?: unknown }
        | null;

      if (!res.ok || !json || json.success === false) {
        throw new Error(json?.error || `Erreur réseau (${res.status})`);
      }

      return (select ? select(json) : defaultSelect(json)) as T;
    })
    .then((data) => {
      cache.set(key, { data, updatedAt: Date.now() });
      return data;
    })
    .catch((error: unknown) => {
      // Keep showing stale data instead of an empty screen when revalidation fails.
      if (entry?.data !== undefined) return entry.data;
      throw error;
    })
    .finally(() => {
      const current = cache.get(key);
      if (current) delete current.promise;
    });

  cache.set(key, { ...(entry ?? { updatedAt: 0 }), promise });
  return promise;
}

export interface FetchQueryOptions<T> {
  select?: Selector<T>;
  ttl?: number;
  force?: boolean;
}

/** Imperative version of the query cache (e.g. fetch an item on click). */
export function fetchQueryData<T>(
  key: string,
  url: string,
  options: FetchQueryOptions<T> = {}
): Promise<T> {
  return fetchQuery(key, url, options.select, options.ttl ?? 30_000, options.force);
}

export interface UseApiQueryOptions<T> {
  select?: Selector<T>;
  /** Freshness window in ms. Defaults to 30s. */
  ttl?: number;
  enabled?: boolean;
  /** Change this value (e.g. refresh counter) to force a revalidation. */
  refreshKey?: number | string;
}

export interface UseApiQueryResult<T> {
  data: T | undefined;
  error: string | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
  setData: (data: T) => void;
}

export function useApiQuery<T>(
  key: string | null,
  url: string | null,
  options: UseApiQueryOptions<T> = {}
): UseApiQueryResult<T> {
  const { select, ttl = 30_000, enabled = true, refreshKey } = options;

  const selectRef = useRef(select);
  selectRef.current = select;

  const [data, setDataState] = useState<T | undefined>(() =>
    key ? getQueryData<T>(key) : undefined
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(
    enabled && !!key && !!url && getQueryData(key) === undefined
  );

  const setData = useCallback((next: T) => {
    if (key) setQueryData(key, next);
    setDataState(next);
  }, [key]);

  const load = useCallback(
    async (force: boolean) => {
      if (!key || !url) return;
      try {
        const result = await fetchQuery<T>(key, url, selectRef.current, ttl, force);
        setDataState(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setIsLoading(false);
      }
    },
    [key, url, ttl]
  );

  useEffect(() => {
    if (!enabled || !key || !url) {
      setIsLoading(false);
      return;
    }

    const cached = getQueryData<T>(key);
    if (cached !== undefined) {
      setDataState(cached);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    let cancelled = false;
    fetchQuery<T>(key, url, selectRef.current, ttl)
      .then((result) => {
        if (cancelled) return;
        setDataState(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key, url, ttl, enabled, refreshKey]);

  const refetch = useCallback(async () => {
    await load(true);
  }, [load]);

  return { data, error, isLoading, refetch, setData };
}
