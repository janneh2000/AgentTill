/**
 * In-memory demo / mock mode when NEXT_PUBLIC_AGENT_TILL_ADDRESS is unset.
 * No LLM required — deterministic mock till for UI walkthroughs.
 */

export type DemoPayment = {
  id: number;
  agent: string;
  agentName: string;
  payee: string;
  amount: number; // USDC human
  reason: string;
  remainingBudget: number;
  ts: number;
  hash: string;
};

export type DemoAgent = {
  address: string;
  name: string;
  spent: number;
  registered: boolean;
};

export type DemoState = {
  budget: number;
  sessionSpent: number;
  paused: boolean;
  maxPerPayment: number;
  dailyCap: number;
  sessionCap: number;
  allowlistEnabled: boolean;
  memoRequired: boolean;
  agents: DemoAgent[];
  allowlist: string[];
  payments: DemoPayment[];
  owner: string;
};

const DEMO_OWNER = "0xOwner0000000000000000000000000000000001";
const DEMO_AGENT = "0xAgent00000000000000000000000000000000001";

let state: DemoState = {
  budget: 2500,
  sessionSpent: 125.5,
  paused: false,
  maxPerPayment: 100,
  dailyCap: 500,
  sessionCap: 5000,
  allowlistEnabled: false,
  memoRequired: true,
  agents: [
    {
      address: DEMO_AGENT,
      name: "GrantBot",
      spent: 125.5,
      registered: true,
    },
  ],
  allowlist: [],
  payments: [
    {
      id: 3,
      agent: DEMO_AGENT,
      agentName: "GrantBot",
      payee: "0xPayee0000000000000000000000000000000002",
      amount: 50,
      reason: "Arc Microgrant — open-source tooling",
      remainingBudget: 2500,
      ts: Date.now() - 3600_000,
      hash: "0xdemo000000000000000000000000000000000000000000000000000000000003",
    },
    {
      id: 2,
      agent: DEMO_AGENT,
      agentName: "GrantBot",
      payee: "0xPayee0000000000000000000000000000000001",
      amount: 40,
      reason: "Community workshop stipend",
      remainingBudget: 2550,
      ts: Date.now() - 7200_000,
      hash: "0xdemo000000000000000000000000000000000000000000000000000000000002",
    },
    {
      id: 1,
      agent: DEMO_AGENT,
      agentName: "GrantBot",
      payee: "0xPayee0000000000000000000000000000000003",
      amount: 35.5,
      reason: "Docs localization bounty",
      remainingBudget: 2590,
      ts: Date.now() - 10800_000,
      hash: "0xdemo000000000000000000000000000000000000000000000000000000000001",
    },
  ],
  owner: DEMO_OWNER,
};

export function getDemoState(): DemoState {
  return structuredClone(state);
}

export function demoSpend(input: {
  amount: number;
  payee: string;
  reason: string;
  agentAddress?: string;
}): { ok: true; payment: DemoPayment } | { ok: false; error: string } {
  if (state.paused) return { ok: false, error: "Till is paused" };
  if (input.amount <= 0) return { ok: false, error: "Amount must be positive" };
  if (state.memoRequired && !input.reason.trim()) {
    return { ok: false, error: "Memo / reason is required" };
  }
  if (input.amount > state.maxPerPayment) {
    return { ok: false, error: `Exceeds max per payment (${state.maxPerPayment} USDC)` };
  }
  if (input.amount > state.budget) {
    return { ok: false, error: "Insufficient till budget" };
  }
  if (state.allowlistEnabled && !state.allowlist.includes(input.payee.toLowerCase())) {
    return { ok: false, error: "Payee not on allowlist" };
  }

  const agentAddr = input.agentAddress ?? DEMO_AGENT;
  const agent = state.agents.find((a) => a.address.toLowerCase() === agentAddr.toLowerCase());
  if (!agent?.registered) return { ok: false, error: "Agent not registered" };

  state.budget -= input.amount;
  state.sessionSpent += input.amount;
  agent.spent += input.amount;

  const payment: DemoPayment = {
    id: state.payments.length + 1,
    agent: agent.address,
    agentName: agent.name,
    payee: input.payee,
    amount: input.amount,
    reason: input.reason,
    remainingBudget: state.budget,
    ts: Date.now(),
    hash: `0xdemo${String(state.payments.length + 1).padStart(60, "0")}`,
  };
  state.payments = [payment, ...state.payments];
  return { ok: true, payment };
}

export function demoFund(amount: number) {
  state.budget += amount;
}

export function demoTogglePause() {
  state.paused = !state.paused;
}

export function demoRegisterAgent(address: string, name: string) {
  const existing = state.agents.find((a) => a.address.toLowerCase() === address.toLowerCase());
  if (existing) {
    existing.registered = true;
    existing.name = name;
    return;
  }
  state.agents.push({ address, name, spent: 0, registered: true });
}

export function resetDemo() {
  state = getDemoState(); // won't fully reset — for simplicity reload page
}
