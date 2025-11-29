/**
 * ASCII visualization helpers for Pi-hole statistics
 *
 * Generates terminal-friendly box-drawing charts and dashboards with ANSI colors
 */

// ANSI color codes (exported for use in tool handlers)
export const C = {
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
  DIM: '\x1b[2m',

  // Foreground colors
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',

  // Bright colors
  BRIGHT_RED: '\x1b[91m',
  BRIGHT_GREEN: '\x1b[92m',
  BRIGHT_YELLOW: '\x1b[93m',
  BRIGHT_BLUE: '\x1b[94m',
  BRIGHT_MAGENTA: '\x1b[95m',
  BRIGHT_CYAN: '\x1b[96m',
};

// Box drawing characters
const BOX = {
  TL: '╔', TR: '╗', BL: '╚', BR: '╝',
  H: '═', V: '║',
  LT: '╠', RT: '╣',
  THIN: '─',
};

const BAR_FULL = '█';
const BAR_PARTIAL = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉'];

/**
 * Format large numbers with K/M suffix
 */
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 10000) return (num / 1000).toFixed(0) + 'K';
  if (num >= 1000) return num.toLocaleString();
  return num.toString();
}

/**
 * Pad string to fixed width
 */
function pad(str: string, width: number, align: 'left' | 'right' = 'left'): string {
  if (str.length >= width) return str.slice(0, width);
  const padding = ' '.repeat(width - str.length);
  return align === 'left' ? str + padding : padding + str;
}

/**
 * Create a horizontal bar
 */
function bar(value: number, max: number, width: number): string {
  if (max === 0) return ' '.repeat(width);
  const ratio = Math.min(value / max, 1);
  const fullBlocks = Math.floor(ratio * width);
  const remainder = (ratio * width) - fullBlocks;
  const partialIndex = Math.floor(remainder * 8);

  let result = BAR_FULL.repeat(fullBlocks);
  if (partialIndex > 0 && result.length < width) {
    result += BAR_PARTIAL[partialIndex];
  }
  return pad(result, width);
}

/**
 * Create a horizontal line
 */
function hline(width: number, left: string = BOX.LT, right: string = BOX.RT): string {
  return left + BOX.H.repeat(width - 2) + right;
}

/**
 * Create a row with content
 */
function row(content: string, width: number): string {
  return BOX.V + ' ' + pad(content, width - 4) + ' ' + BOX.V;
}

/**
 * Create a colored bar
 */
function colorBar(value: number, max: number, width: number, color: string): string {
  const barStr = bar(value, max, width);
  return color + barStr + C.RESET;
}

/**
 * Create the stats dashboard
 */
export function createDashboard(stats: {
  queries: {
    total: number;
    blocked: number;
    percent_blocked: number;
    forwarded: number;
    cached: number;
    unique_domains: number;
  };
  clients: { active: number; total: number };
  gravity: { domains_being_blocked: number; last_update: number };
  topClients?: { ip: string; name?: string; count: number }[];
  topBlocked?: { domain: string; count: number }[];
  topPermitted?: { domain: string; count: number }[];
}): string {
  const W = 78; // Total width
  const lines: string[] = [];

  // Header
  lines.push(C.CYAN + BOX.TL + BOX.H.repeat(W - 2) + BOX.TR + C.RESET);
  lines.push(C.CYAN + BOX.V + C.RESET + C.BOLD + C.BRIGHT_GREEN + '                         🛡️  PI-HOLE DASHBOARD                          ' + C.RESET + C.CYAN + BOX.V + C.RESET);
  lines.push(C.CYAN + hline(W) + C.RESET);

  // Summary section
  lines.push(C.CYAN + BOX.V + C.RESET + ' '.repeat(W - 2) + C.CYAN + BOX.V + C.RESET);
  lines.push(C.CYAN + BOX.V + C.RESET + C.BOLD + C.YELLOW + ' 📊 SUMMARY' + C.RESET + ' '.repeat(W - 14) + C.CYAN + BOX.V + C.RESET);
  lines.push(C.CYAN + BOX.V + C.RESET + ' ' + C.DIM + BOX.THIN.repeat(W - 6) + C.RESET + ' ' + C.CYAN + BOX.V + C.RESET);

  const totalQ = formatNumber(stats.queries.total);
  const blockedQ = formatNumber(stats.queries.blocked);
  const domainsBlocked = formatNumber(stats.gravity.domains_being_blocked);
  const blockRate = stats.queries.percent_blocked.toFixed(1) + '%';

  lines.push(C.CYAN + BOX.V + C.RESET + ` Total Queries:      ${C.BRIGHT_CYAN}${pad(totalQ, 12)}${C.RESET}    Domains Blocked:    ${C.MAGENTA}${pad(domainsBlocked, 12)}${C.RESET}` + C.CYAN + BOX.V + C.RESET);
  lines.push(C.CYAN + BOX.V + C.RESET + ` Blocked:            ${C.BRIGHT_RED}${pad(blockedQ, 12)}${C.RESET}    Active Clients:     ${C.GREEN}${pad(stats.clients.active.toString(), 12)}${C.RESET}` + C.CYAN + BOX.V + C.RESET);
  lines.push(C.CYAN + BOX.V + C.RESET + ` Block Rate:         ${C.BRIGHT_RED}${pad(blockRate, 12)}${C.RESET}    Total Clients:      ${C.DIM}${pad(stats.clients.total.toString(), 12)}${C.RESET}` + C.CYAN + BOX.V + C.RESET);
  lines.push(C.CYAN + BOX.V + C.RESET + ' '.repeat(W - 2) + C.CYAN + BOX.V + C.RESET);

  // Top Clients (if available)
  if (stats.topClients && stats.topClients.length > 0) {
    lines.push(C.CYAN + hline(W) + C.RESET);
    lines.push(C.CYAN + BOX.V + C.RESET + C.BOLD + C.YELLOW + ' 🔝 TOP CLIENTS' + C.RESET + ' '.repeat(W - 18) + C.CYAN + BOX.V + C.RESET);
    lines.push(C.CYAN + BOX.V + C.RESET + ' ' + C.DIM + BOX.THIN.repeat(W - 6) + C.RESET + ' ' + C.CYAN + BOX.V + C.RESET);

    const maxClientCount = Math.max(...stats.topClients.map(c => c.count));
    for (const client of stats.topClients.slice(0, 6)) {
      const label = pad(client.name || client.ip, 16);
      const barStr = colorBar(client.count, maxClientCount, 40, C.BRIGHT_BLUE);
      const count = formatNumber(client.count);
      const pct = ((client.count / stats.queries.total) * 100).toFixed(0);
      lines.push(C.CYAN + BOX.V + C.RESET + ` ${label} ${barStr}  ${C.WHITE}${pad(count, 8, 'right')}${C.RESET} ${C.DIM}(${pad(pct, 2, 'right')}%)${C.RESET}` + C.CYAN + BOX.V + C.RESET);
    }
    lines.push(C.CYAN + BOX.V + C.RESET + ' '.repeat(W - 2) + C.CYAN + BOX.V + C.RESET);
  }

  // Top Blocked (if available)
  if (stats.topBlocked && stats.topBlocked.length > 0) {
    lines.push(C.CYAN + hline(W) + C.RESET);
    lines.push(C.CYAN + BOX.V + C.RESET + C.BOLD + C.YELLOW + ' 🚫 TOP BLOCKED DOMAINS' + C.RESET + ' '.repeat(W - 26) + C.CYAN + BOX.V + C.RESET);
    lines.push(C.CYAN + BOX.V + C.RESET + ' ' + C.DIM + BOX.THIN.repeat(W - 6) + C.RESET + ' ' + C.CYAN + BOX.V + C.RESET);

    const maxBlocked = Math.max(...stats.topBlocked.map(d => d.count));
    for (const domain of stats.topBlocked.slice(0, 6)) {
      const label = pad(domain.domain, 40);
      const barStr = colorBar(domain.count, maxBlocked, 20, C.BRIGHT_RED);
      const count = formatNumber(domain.count);
      lines.push(C.CYAN + BOX.V + C.RESET + ` ${label} ${barStr} ${C.WHITE}${pad(count, 8, 'right')}${C.RESET}` + C.CYAN + BOX.V + C.RESET);
    }
    lines.push(C.CYAN + BOX.V + C.RESET + ' '.repeat(W - 2) + C.CYAN + BOX.V + C.RESET);
  }

  // Top Permitted (if available)
  if (stats.topPermitted && stats.topPermitted.length > 0) {
    lines.push(C.CYAN + hline(W) + C.RESET);
    lines.push(C.CYAN + BOX.V + C.RESET + C.BOLD + C.YELLOW + ' 🌐 TOP PERMITTED DOMAINS' + C.RESET + ' '.repeat(W - 28) + C.CYAN + BOX.V + C.RESET);
    lines.push(C.CYAN + BOX.V + C.RESET + ' ' + C.DIM + BOX.THIN.repeat(W - 6) + C.RESET + ' ' + C.CYAN + BOX.V + C.RESET);

    const maxPermitted = Math.max(...stats.topPermitted.map(d => d.count));
    for (const domain of stats.topPermitted.slice(0, 6)) {
      const label = pad(domain.domain, 40);
      const barStr = colorBar(domain.count, maxPermitted, 20, C.BRIGHT_GREEN);
      const count = formatNumber(domain.count);
      lines.push(C.CYAN + BOX.V + C.RESET + ` ${label} ${barStr} ${C.WHITE}${pad(count, 8, 'right')}${C.RESET}` + C.CYAN + BOX.V + C.RESET);
    }
    lines.push(C.CYAN + BOX.V + C.RESET + ' '.repeat(W - 2) + C.CYAN + BOX.V + C.RESET);
  }

  // Footer
  lines.push(C.CYAN + BOX.BL + BOX.H.repeat(W - 2) + BOX.BR + C.RESET);

  return lines.join('\n');
}

/**
 * Create a bar chart for top items
 */
export function createBarChart(
  title: string,
  items: { label: string; value: number }[],
  total?: number,
  barColor: string = C.BRIGHT_BLUE
): string {
  const W = 78;
  const lines: string[] = [];

  lines.push(C.CYAN + BOX.TL + BOX.H.repeat(W - 2) + BOX.TR + C.RESET);
  lines.push(C.CYAN + BOX.V + C.RESET + C.BOLD + C.YELLOW + ' ' + title + C.RESET + ' '.repeat(W - title.length - 4) + C.CYAN + BOX.V + C.RESET);
  lines.push(C.CYAN + hline(W) + C.RESET);
  lines.push(C.CYAN + BOX.V + C.RESET + ' '.repeat(W - 2) + C.CYAN + BOX.V + C.RESET);

  if (items.length === 0) {
    lines.push(C.CYAN + BOX.V + C.RESET + C.DIM + ' No data available' + C.RESET + ' '.repeat(W - 21) + C.CYAN + BOX.V + C.RESET);
  } else {
    const maxValue = Math.max(...items.map(i => i.value));

    for (const item of items.slice(0, 10)) {
      const label = pad(item.label, 30);
      const barStr = colorBar(item.value, maxValue, 30, barColor);
      const count = formatNumber(item.value);
      const pctStr = total ? C.DIM + ` (${((item.value / total) * 100).toFixed(0)}%)` + C.RESET : '';
      lines.push(C.CYAN + BOX.V + C.RESET + ` ${label} ${barStr} ${C.WHITE}${pad(count, 8, 'right')}${C.RESET}${pctStr}` + C.CYAN + BOX.V + C.RESET);
    }
  }

  lines.push(C.CYAN + BOX.V + C.RESET + ' '.repeat(W - 2) + C.CYAN + BOX.V + C.RESET);
  lines.push(C.CYAN + BOX.BL + BOX.H.repeat(W - 2) + BOX.BR + C.RESET);

  return lines.join('\n');
}
