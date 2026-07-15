export interface SignalNotificationInput {
  pair: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  confidenceScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: string;
  technicalSummary: string;
  aiSummary?: string; // Phase 9's AIAnalysis.summary, when available
}

/** In-app / generic title+body, stored on every Notification row regardless of channel. */
export function buildNotificationContent(signal: SignalNotificationInput): {
  title: string;
  body: string;
} {
  const arrow = signal.direction === 'BUY' ? '▲' : '▼';
  const title = `${arrow} ${signal.direction} · ${signal.pair} · ${signal.timeframe}`;
  const body = signal.aiSummary ?? signal.technicalSummary;
  return { title, body };
}

/** Telegram supports basic HTML formatting — bold pair/direction, monospace price. */
export function buildTelegramMessage(signal: SignalNotificationInput): string {
  const arrow = signal.direction === 'BUY' ? '🟢 BUY' : '🔴 SELL';
  const lines = [
    `<b>${arrow} ${signal.pair}</b> · ${signal.timeframe}`,
    `Confidence: <b>${signal.confidenceScore}%</b> · Risk: <b>${signal.riskLevel}</b>`,
    `Entry: <code>${signal.entryPrice}</code>`,
    '',
    signal.aiSummary ?? signal.technicalSummary,
  ];
  return lines.join('\n');
}

/** Full HTML email body. */
export function buildSignalEmail(signal: SignalNotificationInput): {
  subject: string;
  html: string;
} {
  const subject = `${signal.direction} signal: ${signal.pair} (${signal.confidenceScore}% confidence)`;
  const riskColor =
    signal.riskLevel === 'HIGH' ? '#ef4444' : signal.riskLevel === 'MEDIUM' ? '#f59e0b' : '#22c55e';

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="margin-bottom: 4px;">${signal.direction} · ${signal.pair}</h2>
      <p style="color: #666; margin-top: 0;">${signal.timeframe} · Entry ${signal.entryPrice}</p>
      <p>
        <strong>Confidence:</strong> ${signal.confidenceScore}%<br/>
        <strong>Risk:</strong> <span style="color: ${riskColor};">${signal.riskLevel}</span>
      </p>
      <p>${signal.aiSummary ?? signal.technicalSummary}</p>
      <p style="color: #999; font-size: 12px; margin-top: 24px;">
        Informational only — not financial advice. You make every trading decision.
      </p>
    </div>
  `.trim();

  return { subject, html };
}

/** Compact payload for a Web Push notification (kept small — push payloads have a size limit). */
export function buildPushPayload(signal: SignalNotificationInput): {
  title: string;
  body: string;
  url: string;
} {
  const { title, body } = buildNotificationContent(signal);
  return { title, body: body.slice(0, 150), url: '/dashboard/signals' };
}
