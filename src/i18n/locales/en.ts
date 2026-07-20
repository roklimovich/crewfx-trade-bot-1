export const en = {
  common: {
    save: 'Save',
    saved: 'Saved',
    cancel: 'Cancel',
    loading: 'Loading…',
    submit: 'Submit',
    close: 'Close',
    logIn: 'Log in',
    logOut: 'Log out',
    settings: 'Settings',
    back: 'Back',
  },
  nav: {
    features: 'Features',
    pricing: 'Pricing',
    faq: 'FAQ',
    getStarted: 'Get started',
  },
  hero: {
    badge: 'Reading 40+ pairs across Forex & OTC, right now',
    titleLine1: 'Signals that show',
    titleHighlight: 'their work.',
    description:
      'SignalForge scores every pair on trend, momentum, and volatility, then only speaks up when multiple indicators agree. Every signal ships with the reasoning behind it — not just a direction and a countdown.',
    ctaPrimary: 'Start reading signals',
    ctaSecondary: 'See how it works',
    disclaimer:
      'Informational signals only. SignalForge never places trades — every decision stays yours.',
  },
  features: {
    heading: 'Built to say less, and mean it',
    subheading:
      'Most signal feeds optimize for volume. SignalForge optimizes for the moments actually worth acting on.',
    items: [
      {
        title: 'Multi-indicator confirmation',
        description:
          'RSI, MACD, EMA, ADX, and Bollinger Bands all have to agree before a signal ships. One indicator alone never triggers anything.',
      },
      {
        title: 'Reads structure, not noise',
        description:
          'The engine holds back during ranging, low-volume, or low-confidence conditions instead of forcing a call on a coin flip.',
      },
      {
        title: 'Risk labeled up front',
        description:
          'Every signal carries a Low / Medium / High risk tag next to its confidence score — sized for how the market is actually behaving.',
      },
      {
        title: 'Plain-language reasoning',
        description:
          'An AI layer explains why the rules fired in a sentence you can actually use, without ever overriding what the rules decided.',
      },
      {
        title: 'Delivered where you already are',
        description:
          'Telegram, email, or push — signals reach you the moment they generate, not on a refresh cycle.',
      },
      {
        title: 'Every call, tracked',
        description:
          'Win rate, by pair and by timeframe, calculated from real closed outcomes — not the signals that would have worked.',
      },
    ],
  },
  benefits: {
    heading1: 'Less time watching charts.',
    heading2: 'More time deciding.',
    items: [
      'Stop scanning six timeframes by hand — the engine already cross-checked them before you saw the alert.',
      'Confidence scores mean you can size positions by conviction instead of gut feel.',
      'Every signal links back to the exact indicator values that produced it, so you can audit any call later.',
      'Pending accounts stay invisible to the signal feed until an admin approves them — no unvetted access.',
    ],
    telegramLabel: 'Telegram · SignalForge Bot',
  },
  stats: {
    items: [
      { value: '40+', label: 'Forex & OTC pairs monitored' },
      { value: '6', label: 'Indicators cross-checked per signal' },
      { value: '7', label: 'Timeframes, from M1 to D1' },
      { value: '24/5', label: 'Market coverage, no gaps' },
    ],
    disclaimer:
      "Platform coverage, not performance guarantees. Past signal accuracy for any pair is visible on your dashboard once you're signed in — see it before you trust it.",
  },
  testimonials: {
    heading: 'Traders read the reasoning, not just the arrow',
  },
  pricing: {
    heading: 'Pricing that scales with conviction',
    subheading: 'Start free. Upgrade once the signals earn your trust.',
    mostPopular: 'Most popular',
    note: 'Placeholder pricing.',
    tiers: [
      {
        name: 'Starter',
        price: '$0',
        period: 'forever',
        description: 'Get a feel for how the engine reasons before you commit to anything.',
        features: [
          '3 signals/day',
          'M15 & H1 timeframes',
          'Email delivery',
          'Signal history (7 days)',
        ],
        cta: 'Start free',
      },
      {
        name: 'Pro',
        price: '$39',
        period: 'per month',
        description: 'For traders acting on signals daily, across more pairs and timeframes.',
        features: [
          'Unlimited signals',
          'All timeframes, M1–D1',
          'Telegram + email + push',
          'AI reasoning on every signal',
          'Full signal history & analytics',
        ],
        cta: 'Start 7-day trial',
      },
      {
        name: 'Elite',
        price: '$99',
        period: 'per month',
        description: 'Priority delivery and deeper analytics for higher-frequency trading.',
        features: [
          'Everything in Pro',
          'Priority signal delivery',
          'Exportable performance reports',
          'Direct support channel',
        ],
        cta: 'Talk to us',
      },
    ],
  },
  faq: {
    heading: 'Questions worth answering directly',
    items: [
      {
        q: 'Is this financial advice?',
        a: 'No. SignalForge surfaces technical-analysis signals for informational purposes only. It never places trades on your behalf, and every entry, exit, and position size is a decision you make yourself.',
      },
      {
        q: 'How is the confidence score calculated?',
        a: "The engine weighs how many indicators agree, current volatility, and trend strength. Scores below your account's minimum threshold are never published — you only see signals that cleared the bar.",
      },
      {
        q: 'What is the Pocket Option ID for?',
        a: "Submitting your Pocket Option account ID lets an admin verify your account before signals unlock. It's a verification step, never a way for us to access or trade on your broker account — we only ever ask for the ID, never credentials.",
      },
      {
        q: 'Which markets does SignalForge cover?',
        a: 'Major, minor, and exotic Forex pairs plus commonly traded OTC instruments, across seven timeframes from M1 to D1.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes — Pro and Elite are month-to-month with no lock-in. Downgrading to Starter keeps your account and signal history intact.',
      },
    ],
  },
  cta: {
    heading: 'See the next signal before you decide anything',
    description:
      'Free to start, no card required. Watch the reasoning arrive before you commit to a plan.',
    button: 'Create your free account',
  },
  footer: {
    description:
      'Rule-based, confidence-scored trading signals for Forex and OTC markets. Informational only — not financial advice, and never auto-traded.',
    product: 'Product',
    company: 'Company',
    legal: 'Legal',
    about: 'About',
    contact: 'Contact',
    terms: 'Terms of service',
    privacy: 'Privacy policy',
    riskDisclosure: 'Risk disclosure',
    apiDocs: 'API Docs',
    rights: 'All rights reserved.',
    riskWarning: 'Trading involves risk. Signals are informational and not a guarantee of outcome.',
  },
  auth: {
    login: {
      title: 'Welcome back',
      subtitle: "Log in to see today's signals.",
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot password?',
      code: 'Authenticator code',
      submit: 'Log in',
      submitting: 'Logging in…',
      verifyAndLogIn: 'Verify & log in',
      noAccount: "Don't have an account?",
      createOne: 'Create one',
    },
    register: {
      title: 'Create your account',
      subtitle: 'Free to start — no card required.',
      name: 'Name',
      email: 'Email',
      password: 'Password',
      passwordHint: '10+ characters, with upper, lower, and a digit.',
      submit: 'Create account',
      haveAccount: 'Already have an account?',
      checkEmail: 'Check your email',
      checkEmailDescriptionPrefix: 'We sent a verification link to',
      checkEmailDescriptionSuffix:
        'Confirm it, then an admin approves your account before signals unlock.',
      backToLogin: 'Back to login',
    },
  },
  dashboard: {
    nav: {
      overview: 'Overview',
      signals: 'Signals',
      settings: 'Settings',
      adminPanel: 'Admin panel',
    },
    footerNote: 'Signals are informational only. You make every trading decision.',
    overview: {
      title: 'Overview',
      subtitle: "Here's what the engine is seeing right now.",
      activeSignals: 'Active signals',
      winRate: 'Win rate (all time)',
      signalsToday: 'Signals today',
      avgConfidence: 'Avg. confidence',
      recentSignals: 'Recent signals',
      viewAll: 'View all',
    },
    signals: {
      title: 'Signals',
      subtitle: 'Full history and search — filter, search, and export below.',
      searchPlaceholder: 'Search technical summary…',
      pairPlaceholder: 'Pair (e.g. EUR/USD)',
      export: 'Export CSV',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Manage your profile, integrations, and security.',
      profile: 'Profile',
      pocketOption: 'Pocket Option',
      telegram: 'Telegram',
      pushNotifications: 'Push notifications',
      twoFactor: 'Two-factor authentication',
    },
  },
} as const;

// Deliberately NOT `type Messages = typeof en` directly — with `as const` above, that would
// infer every leaf as a string LITERAL type (e.g. `save: "Save"`), which means ru.ts's `save:
// "Сохранить"` could never satisfy it (a different literal isn't assignable to another literal).
// `as const` is still useful for en.ts itself — it keeps the *shape* (nested objects, array
// lengths/order) strict — this mapped type only widens the leaf string/array-of-string values.
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : { [K in keyof T]: Widen<T[K]> };

export type Messages = Widen<typeof en>;
