export type BoardItemStatus = 'needs-user' | 'needs-qa' | 'done' | 'next';

export type AssistantBoardItem = {
  id: string;
  title: string;
  owner: 'tan' | 'Anya';
  status: BoardItemStatus;
  detail: string;
  whyItMatters?: string;
};

export type AssistantPerson = {
  name: 'tan' | 'Anya';
  role: string;
  currentResponsibility: string;
};

export type FutureAgentSlot = {
  name: string;
  purpose: string;
  trigger: string;
};

export type AssistantDashboardModel = {
  activeFocus: {
    slug: 'trading-overview';
    title: string;
    summary: string;
    nextBuildItems: string[];
  };
  userActionItems: AssistantBoardItem[];
  anyaCompletedItems: AssistantBoardItem[];
  qaVerifyItems: AssistantBoardItem[];
  anyaNextItems: AssistantBoardItem[];
  agentPanel: {
    people: AssistantPerson[];
    futureSlots: FutureAgentSlot[];
  };
};

export function getAssistantDashboardModel(): AssistantDashboardModel {
  return {
    activeFocus: {
      slug: 'trading-overview',
      title: 'Trading overview cockpit',
      summary:
        'Build a private dashboard where tan and Anya coordinate tasks first, then layer in AI/edge-AI/physical-AI stock screening, chart review, mock trades, and weekly digest signals.',
      nextBuildItems: [
        'Add screener ranking for the AI/physical-AI universe using the Anya Indicator score.',
        'Add mock-trade ledger with entry, stop, target, invalidation, size, outcome, and SPY comparison.',
        'Add scheduled Telegram report feed once the dashboard data shape is stable.',
      ],
    },
    userActionItems: [
      {
        id: 'user-ssh-tunnel',
        title: 'Open laptop-only SSH port forward',
        owner: 'tan',
        status: 'needs-user',
        detail:
          'Use SSH local forwarding so only your laptop can see the VPS app: ssh -N -L 3000:127.0.0.1:3000 host@31.57.224.162',
        whyItMatters: 'This replaces public port exposure and matches your requirement that the dashboard is visible only from your laptop.',
      },
      {
        id: 'user-dashboard-qa',
        title: 'QA the private dashboard flow',
        owner: 'tan',
        status: 'needs-user',
        detail: 'After the tunnel is open, visit http://127.0.0.1:3000/dashboard and confirm the board matches how you want to work.',
        whyItMatters: 'We should not build the trading cockpit on top of a coordination view you dislike.',
      },
      {
        id: 'user-data-source-choice',
        title: 'Choose production market-data path later',
        owner: 'tan',
        status: 'needs-user',
        detail: 'For now Yahoo Finance is enough. Later choose Alpaca paper, Polygon, Finnhub, or another paid/free provider for durability.',
        whyItMatters: 'The mock-trading ledger and scheduled digests need reliable historical and current prices.',
      },
    ],
    anyaCompletedItems: [
      {
        id: 'anya-openstock-fork',
        title: 'Forked OpenStock into Anya stock lab branch',
        owner: 'Anya',
        status: 'done',
        detail: 'Created and pushed branch anya-stock-lab-v0 with the native lab prototype.',
      },
      {
        id: 'anya-native-lab',
        title: 'Built native /lab/[symbol] chart lab',
        owner: 'Anya',
        status: 'done',
        detail: 'Added Yahoo candle ingestion, lightweight-charts rendering, EMA overlays, support/resistance clusters, and Anya Indicator v0.',
      },
      {
        id: 'anya-tests-build',
        title: 'Verified prior lab build and tests',
        owner: 'Anya',
        status: 'done',
        detail: 'Previous verification passed with 79 tests, 4 skipped, build success, and /api/lab/NVDA returning valid JSON.',
      },
    ],
    qaVerifyItems: [
      {
        id: 'qa-private-access',
        title: 'Verify laptop-only access',
        owner: 'tan',
        status: 'needs-qa',
        detail: 'Confirm the app is reachable through http://127.0.0.1:3000 only after SSH forwarding, not as a public VPS port.',
      },
      {
        id: 'qa-lab-nvda',
        title: 'Verify /lab/NVDA usability',
        owner: 'tan',
        status: 'needs-qa',
        detail: 'Check whether the NVDA lab page loads, chart renders, and the score/verdict/support/resistance panels are understandable.',
      },
      {
        id: 'qa-dashboard-copy',
        title: 'Verify board wording and workflow',
        owner: 'tan',
        status: 'needs-qa',
        detail: 'Tell Anya which labels/statuses should change before this becomes the home cockpit.',
      },
    ],
    anyaNextItems: [
      {
        id: 'next-screener',
        title: 'Build AI stock screener board',
        owner: 'Anya',
        status: 'next',
        detail: 'Create /api/lab/screen and a dashboard panel ranking NVDA, AMD, AVGO, TSM, ASML, AMAT, LRCX, MU, MRVL, COHR, LITE, VRT, ANET, and CRDO.',
      },
      {
        id: 'next-mock-ledger',
        title: 'Add mock-trade ledger',
        owner: 'Anya',
        status: 'next',
        detail: 'Track thesis, entry, stop, target, invalidation, confidence, position size, result, and lessons learned.',
      },
      {
        id: 'next-agent-ready-panel',
        title: 'Prepare multi-agent slots',
        owner: 'Anya',
        status: 'next',
        detail: 'Keep the panel ready for future specialist AI agents without adding fake agents before we need them.',
      },
    ],
    agentPanel: {
      people: [
        {
          name: 'tan',
          role: 'Owner / final QA',
          currentResponsibility: 'Approve access, verify UX, make account/API-key decisions, and choose trading risk preferences.',
        },
        {
          name: 'Anya',
          role: 'Builder / research assistant',
          currentResponsibility: 'Build the dashboard, maintain the stock lab, run checks, report blockers, and prepare next tasks.',
        },
      ],
      futureSlots: [
        {
          name: 'Research agent',
          purpose: 'Monitor AI/edge-AI/physical-AI news, filings, earnings, and source-backed catalysts.',
          trigger: 'Add when source volume is too high for one weekly digest.',
        },
        {
          name: 'Quant/backtest agent',
          purpose: 'Backtest indicator hypotheses and compare strategies against SPY/QQQ benchmarks.',
          trigger: 'Add after the mock-trade schema and data provider are stable.',
        },
        {
          name: 'QA/security agent',
          purpose: 'Check dashboard changes, privacy assumptions, auth, deployment, and data-integrity risks.',
          trigger: 'Add before opening access beyond laptop-only SSH forwarding.',
        },
      ],
    },
  };
}
