// ============================================================
// Destiny AI Forge — Bungie API TypeScript Interfaces
// ============================================================

/**
 * Generic wrapper for all Bungie Platform API responses.
 * Every response from `https://www.bungie.net/Platform/` follows this shape.
 */
export interface BungieApiResponse<T> {
  Response: T;
  ErrorCode: number;
  ThrottleSeconds: number;
  ErrorStatus: string;
  Message: string;
  MessageData: Record<string, string>;
}

/**
 * Token response from `/Platform/App/OAuth/token/`
 */
export interface BungieTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  membership_id: string;
}

/**
 * User membership info returned after token exchange.
 * Used to identify the player's platform and Bungie.net membership.
 */
export interface DestinyMembership {
  membershipType: number;
  membershipId: string;
  displayName: string;
  bungieGlobalDisplayName: string;
  bungieGlobalDisplayNameCode: number;
}

/**
 * Response shape for `/Platform/User/GetMembershipsForCurrentUser/`
 */
export interface UserMembershipsResponse {
  destinyMemberships: DestinyMembership[];
  primaryMembershipId: string;
  bungieNetUser: {
    membershipId: string;
    uniqueName: string;
    displayName: string;
    profilePicturePath: string;
  };
}

/**
 * Encrypted session payload stored in HTTP-only cookie.
 * Tokens never leave the server — only session metadata goes to client.
 */
export interface SessionPayload {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;    // Unix timestamp in ms
  refreshTokenExpiresAt: number;   // Unix timestamp in ms
  bungieMembershipId: string;
  destinyMembershipId?: string;
  destinyMembershipType?: number;
  displayName?: string;
}

/**
 * Client-safe session info (no tokens, no secrets).
 */
export interface ClientSessionInfo {
  isAuthenticated: boolean;
  bungieMembershipId: string;
  destinyMembershipId?: string;
  destinyMembershipType?: number;
  displayName?: string;
  expiresAt: number;
}

/**
 * Manifest metadata returned by `/Platform/Destiny2/Manifest/`
 */
export interface DestinyManifestResponse {
  version: string;
  mobileAssetContentPath: string;
  mobileWorldContentPaths: Record<string, string>;
  jsonWorldContentPaths: Record<string, string>;
  jsonWorldComponentContentPaths: Record<string, Record<string, string>>;
}

// ── Bungie Action Endpoints (TransferItem / EquipItems) ─────

/**
 * Request body para POST /Destiny2/Actions/Items/TransferItem/
 */
export interface TransferItemRequest {
  /** Hash del item en el Manifest */
  itemReferenceHash: number;
  /** Cantidad a transferir (1 para items no-apilables) */
  stackSize: number;
  /** true = mover AL vault, false = mover DEL vault al personaje */
  transferToVault: boolean;
  /** itemInstanceId del item específico */
  itemId: string;
  /** characterId del personaje involucrado */
  characterId: string;
  /** Plataforma del membership (Steam=3, Xbox=1, PSN=2, etc.) */
  membershipType: number;
}

/**
 * Request body para POST /Destiny2/Actions/Items/EquipItems/
 */
export interface EquipItemsRequest {
  /** Array de itemInstanceIds a equipar */
  itemIds: string[];
  /** characterId del personaje */
  characterId: string;
  /** Plataforma del membership */
  membershipType: number;
}

/**
 * Resultado individual de un equip dentro de EquipItems
 */
export interface EquipResult {
  /** itemInstanceId del item */
  itemInstanceId: string;
  /** Código de resultado (1 = éxito, otros = error específico de Bungie) */
  equipStatus: number;
}

/**
 * Respuesta completa de EquipItems
 */
export interface EquipItemsResponse {
  equipResults: EquipResult[];
}

