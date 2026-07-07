export type TokenType = "local" | "portal";

interface StoredToken {
  appToken: string;
  refreshToken: string;
  type: TokenType;
}

const PORTAL_KEY = "hrm_token_portal";
const LEGACY_TOKEN_KEY = "token";

function isTokenExpiryValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (
      typeof payload.exp === "number" &&
      payload.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

function parseStoredToken(raw: string | null): StoredToken | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.appToken) {
      return parsed as StoredToken;
    }
  } catch {}
  return null;
}

function parseLegacyToken(raw: string | null): StoredToken | null {
  if (!raw) return null;
  return {
    appToken: raw,
    refreshToken: "",
    type: "local",
  };
}

export const tokenService = {
  save(appToken: string, refreshToken: string, type: TokenType): void {
    if (type === "local") {
      localStorage.setItem(LEGACY_TOKEN_KEY, appToken);
      sessionStorage.removeItem(PORTAL_KEY);
      return;
    }

    const payload = JSON.stringify({ appToken, refreshToken, type });
    sessionStorage.setItem(PORTAL_KEY, payload);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  },

  saveTokens(appToken: string, refreshToken: string): void {
    this.save(appToken, refreshToken, "portal");
  },

  get(): StoredToken | null {
    const portalToken = parseStoredToken(sessionStorage.getItem(PORTAL_KEY));
    if (portalToken) {
      return portalToken;
    }

    const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacyToken) {
      return parseLegacyToken(legacyToken);
    }

    return null;
  },

  getAppToken(): string | null {
    return this.get()?.appToken ?? null;
  },

  getType(): TokenType | null {
    return this.get()?.type ?? null;
  },

  clear(type?: TokenType): void {
    if (!type || type === "portal") sessionStorage.removeItem(PORTAL_KEY);
    if (!type || type === "local") localStorage.removeItem(LEGACY_TOKEN_KEY);
  },

  isValid(): boolean {
    const token = this.getAppToken();
    if (!token) return false;
    return isTokenExpiryValid(token);
  },

  hasValidPortalToken(): boolean {
    const portalToken = parseStoredToken(sessionStorage.getItem(PORTAL_KEY));
    return !!portalToken?.appToken && isTokenExpiryValid(portalToken.appToken);
  },

  hasValidLocalToken(): boolean {
    const localToken = localStorage.getItem(LEGACY_TOKEN_KEY);
    return !!localToken && isTokenExpiryValid(localToken);
  },
};
