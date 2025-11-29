/**
 * Pi-hole v6 API Client
 *
 * Pi-hole v6 uses session-based authentication:
 * 1. POST /api/auth with password to get session ID (sid)
 * 2. Include sid in X-FTL-SID header for subsequent requests
 */

export interface PiholeConfig {
  url: string;
  password: string;
}

export interface AuthResponse {
  session: {
    valid: boolean;
    totp: boolean;
    sid: string;
    csrf: string;
    validity: number;
    message: string;
  };
}

export interface StatsResponse {
  queries: {
    total: number;
    blocked: number;
    percent_blocked: number;
    unique_domains: number;
    forwarded: number;
    cached: number;
    types: Record<string, number>;
    status: Record<string, number>;
    replies: Record<string, number>;
  };
  clients: {
    active: number;
    total: number;
  };
  gravity: {
    domains_being_blocked: number;
    last_update: number;
  };
  system?: {
    uptime: number;
    memory: {
      ram: {
        total: number;
        used: number;
        free: number;
        percent_used: number;
      };
    };
    cpu: {
      nprocs: number;
      load: number[];
      percent_used: number;
    };
  };
}

export interface TopDomainsResponse {
  domains: Array<{
    domain: string;
    count: number;
  }>;
  total_queries: number;
}

export interface TopClientsResponse {
  clients: Array<{
    ip: string;
    name: string;
    count: number;
  }>;
  total_queries: number;
}

export interface QueryLogEntry {
  id: number;
  time: number;
  type: string;
  domain: string;
  client: string;
  status: string;
  dnssec: string;
  reply: string;
  response_time: number;
  upstream: string;
}

export interface BlockingStatus {
  blocking: "enabled" | "disabled";
  timer: number | null;
}

export class PiholeClient {
  private config: PiholeConfig;
  private sid: string | null = null;
  private csrf: string | null = null;
  private sessionExpiry: number = 0;

  constructor(config: PiholeConfig) {
    this.config = {
      url: config.url.replace(/\/$/, ''), // Remove trailing slash
      password: config.password
    };
  }

  /**
   * Authenticate with Pi-hole and get session ID
   */
  async authenticate(): Promise<void> {
    const response = await fetch(`${this.config.url}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: this.config.password }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as AuthResponse;

    if (!data.session?.valid) {
      throw new Error(`Authentication failed: ${data.session?.message || 'Invalid credentials'}`);
    }

    this.sid = data.session.sid;
    this.csrf = data.session.csrf;
    this.sessionExpiry = Date.now() + (data.session.validity * 1000);
  }

  /**
   * Ensure we have a valid session
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.sid || Date.now() >= this.sessionExpiry - 60000) {
      await this.authenticate();
    }
  }

  /**
   * Make an authenticated API request
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await this.ensureAuthenticated();

    const url = `${this.config.url}/api${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.sid) {
      headers['X-FTL-SID'] = this.sid;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${text}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get Pi-hole statistics
   */
  async getStats(): Promise<StatsResponse> {
    return this.request<StatsResponse>('/stats/summary');
  }

  /**
   * Get top blocked domains
   */
  async getTopBlockedDomains(count: number = 10): Promise<TopDomainsResponse> {
    return this.request<TopDomainsResponse>(`/stats/top_domains?blocked=true&count=${count}`);
  }

  /**
   * Get top permitted domains
   */
  async getTopPermittedDomains(count: number = 10): Promise<TopDomainsResponse> {
    return this.request<TopDomainsResponse>(`/stats/top_domains?blocked=false&count=${count}`);
  }

  /**
   * Get top clients
   */
  async getTopClients(count: number = 10): Promise<TopClientsResponse> {
    return this.request<TopClientsResponse>(`/stats/top_clients?count=${count}`);
  }

  /**
   * Get recent query log
   */
  async getQueryLog(count: number = 100): Promise<{ queries: QueryLogEntry[] }> {
    return this.request<{ queries: QueryLogEntry[] }>(`/queries?length=${count}`);
  }

  /**
   * Get blocking status
   */
  async getBlockingStatus(): Promise<BlockingStatus> {
    return this.request<BlockingStatus>('/dns/blocking');
  }

  /**
   * Enable blocking
   */
  async enableBlocking(): Promise<BlockingStatus> {
    return this.request<BlockingStatus>('/dns/blocking', {
      method: 'POST',
      body: JSON.stringify({ blocking: true }),
    });
  }

  /**
   * Disable blocking (optionally for a duration in seconds)
   */
  async disableBlocking(duration?: number): Promise<BlockingStatus> {
    const body: { blocking: boolean; timer?: number } = { blocking: false };
    if (duration) {
      body.timer = duration;
    }
    return this.request<BlockingStatus>('/dns/blocking', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Add domain to whitelist
   */
  async addToWhitelist(domain: string): Promise<void> {
    await this.request('/domains/allow/exact', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  }

  /**
   * Add domain to blacklist
   */
  async addToBlacklist(domain: string): Promise<void> {
    await this.request('/domains/deny/exact', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  }

  /**
   * Remove domain from whitelist
   */
  async removeFromWhitelist(domain: string): Promise<void> {
    await this.request(`/domains/allow/exact/${encodeURIComponent(domain)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Remove domain from blacklist
   */
  async removeFromBlacklist(domain: string): Promise<void> {
    await this.request(`/domains/deny/exact/${encodeURIComponent(domain)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get whitelist
   */
  async getWhitelist(): Promise<{ domains: string[] }> {
    return this.request<{ domains: string[] }>('/domains/allow/exact');
  }

  /**
   * Get blacklist
   */
  async getBlacklist(): Promise<{ domains: string[] }> {
    return this.request<{ domains: string[] }>('/domains/deny/exact');
  }

  /**
   * Update gravity (blocklist)
   */
  async updateGravity(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/action/gravity', {
      method: 'POST',
    });
  }

  /**
   * Flush DNS cache
   */
  async flushCache(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/action/flush/cache', {
      method: 'POST',
    });
  }

  /**
   * Test connection to Pi-hole
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch {
      return false;
    }
  }
}
