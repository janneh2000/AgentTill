"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultNetwork,
  getEnvTillAddress,
  isDemoMode,
  readStoredTillAddress,
  writeStoredTillAddress,
} from "@/config/env";
import type { NetworkId } from "@/config/chains";
import {
  demoFund,
  demoRegisterAgent,
  demoSpend,
  demoTogglePause,
  getDemoState,
  type DemoState,
} from "@/lib/demo-store";

type AppState = {
  network: NetworkId;
  setNetwork: (n: NetworkId) => void;
  /** Effective till (localStorage override → env). */
  tillAddress: `0x${string}` | undefined;
  /** Persist a runtime till override (or clear with null). */
  setTillAddressOverride: (addr: string | null) => string | null;
  demo: boolean;
  demoState: DemoState;
  refreshDemo: () => void;
  runDemoSpend: (amount: number, payee: string, reason: string) => string | null;
  runDemoFund: (amount: number) => void;
  runDemoPause: () => void;
  runDemoRegister: (address: string, name: string) => void;
};

const Ctx = createContext<AppState | null>(null);

function normalizeAddress(raw: string): `0x${string}` | null {
  const v = raw.trim();
  if (!v.startsWith("0x") || v.length !== 42) return null;
  return v as `0x${string}`;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [network, setNetwork] = useState<NetworkId>(defaultNetwork());
  const [demoState, setDemoState] = useState<DemoState>(() => getDemoState());
  /** Runtime override from localStorage / TillAddressBar; undefined = use env. */
  const [tillOverride, setTillOverride] = useState<`0x${string}` | null | undefined>(
    undefined,
  );

  useEffect(() => {
    const stored = readStoredTillAddress();
    setTillOverride(stored ?? null);
  }, []);

  const tillAddress = useMemo(() => {
    if (tillOverride === undefined) {
      // Pre-hydration: prefer env so SSR matches Cloudflare build when set.
      return getEnvTillAddress() ?? undefined;
    }
    if (tillOverride) return tillOverride;
    return getEnvTillAddress();
  }, [tillOverride]);

  const demo = isDemoMode(tillAddress ?? null);

  const setTillAddressOverride = useCallback((addr: string | null): string | null => {
    if (addr === null || addr.trim() === "") {
      writeStoredTillAddress(null);
      setTillOverride(null);
      return null;
    }
    const normalized = normalizeAddress(addr);
    if (!normalized) return "Enter a valid 0x… address (42 chars)";
    writeStoredTillAddress(normalized);
    setTillOverride(normalized);
    return null;
  }, []);

  const refreshDemo = useCallback(() => {
    setDemoState(getDemoState());
  }, []);

  const runDemoSpend = useCallback(
    (amount: number, payee: string, reason: string) => {
      const res = demoSpend({ amount, payee, reason });
      refreshDemo();
      return res.ok ? null : res.error;
    },
    [refreshDemo],
  );

  const runDemoFund = useCallback(
    (amount: number) => {
      demoFund(amount);
      refreshDemo();
    },
    [refreshDemo],
  );

  const runDemoPause = useCallback(() => {
    demoTogglePause();
    refreshDemo();
  }, [refreshDemo]);

  const runDemoRegister = useCallback(
    (address: string, name: string) => {
      demoRegisterAgent(address, name);
      refreshDemo();
    },
    [refreshDemo],
  );

  const value = useMemo(
    () => ({
      network,
      setNetwork,
      tillAddress,
      setTillAddressOverride,
      demo,
      demoState,
      refreshDemo,
      runDemoSpend,
      runDemoFund,
      runDemoPause,
      runDemoRegister,
    }),
    [
      network,
      tillAddress,
      setTillAddressOverride,
      demo,
      demoState,
      refreshDemo,
      runDemoSpend,
      runDemoFund,
      runDemoPause,
      runDemoRegister,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState outside provider");
  return v;
}
