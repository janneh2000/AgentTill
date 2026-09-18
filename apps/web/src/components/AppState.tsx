"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { defaultNetwork, isDemoMode } from "@/config/env";
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
  demo: boolean;
  demoState: DemoState;
  refreshDemo: () => void;
  runDemoSpend: (amount: number, payee: string, reason: string) => string | null;
  runDemoFund: (amount: number) => void;
  runDemoPause: () => void;
  runDemoRegister: (address: string, name: string) => void;
};

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [network, setNetwork] = useState<NetworkId>(defaultNetwork());
  const [demoState, setDemoState] = useState<DemoState>(() => getDemoState());
  const demo = isDemoMode();

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
