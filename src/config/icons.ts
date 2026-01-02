// Game Icons Configuration
export const GAME_ICONS = {
  // Navigation & UI
  BACK: { name: 'arrow-back', family: 'material' as const },
  HOME: { name: 'home', family: 'material' as const },
  CLOSE: { name: 'close', family: 'material' as const },
  MENU: { name: 'menu', family: 'material' as const },
  SETTINGS: { name: 'settings', family: 'material' as const },

  // Game Actions
  PLAY: { name: 'play-arrow', family: 'material' as const },
  PAUSE: { name: 'pause', family: 'material' as const },
  RESTART: { name: 'refresh', family: 'material' as const },
  NEXT: { name: 'skip-next', family: 'material' as const },
  PREVIOUS: { name: 'skip-previous', family: 'material' as const },

  // Game Elements
  TARGET: { name: 'gps-fixed', family: 'material' as const },
  LOCK: { name: 'lock', family: 'material' as const },
  UNLOCK: { name: 'lock-open', family: 'material' as const },
  SHIELD: { name: 'shield', family: 'material-community' as const },
  EXPLOSION: { name: 'explosion', family: 'material-community' as const },

  // Power-ups & Abilities
  LIGHTNING: { name: 'flash-on', family: 'material' as const },
  FREEZE: { name: 'ac-unit', family: 'material' as const },
  FIRE: { name: 'whatshot', family: 'material' as const },
  BOMB: { name: 'bomb', family: 'material-community' as const },
  RAINBOW: { name: 'palette', family: 'material' as const },

  // Progress & Stats
  STAR: { name: 'star', family: 'material' as const },
  STAR_OUTLINE: { name: 'star-border', family: 'material' as const },
  TROPHY: { name: 'trophy', family: 'material-community' as const },
  MEDAL: { name: 'medal', family: 'material-community' as const },
  CROWN: { name: 'crown', family: 'material-community' as const },
  SCORE: { name: 'trending-up', family: 'material' as const },

  // Currency & Rewards
  COIN: { name: 'toll', family: 'material' as const },
  DIAMOND: { name: 'diamond', family: 'material-community' as const },
  GIFT: { name: 'card-giftcard', family: 'material' as const },

  // Social & Leaderboard
  LEADERBOARD: { name: 'leaderboard', family: 'material' as const },
  PERSON: { name: 'person', family: 'material' as const },
  GROUP: { name: 'group', family: 'material' as const },
  SHARE: { name: 'share', family: 'material' as const },

  // Shop & Purchase
  SHOP: { name: 'shopping-cart', family: 'material' as const },
  BUY: { name: 'add-shopping-cart', family: 'material' as const },
  WALLET: { name: 'account-balance-wallet', family: 'material' as const },

  // Audio & Effects
  VOLUME_ON: { name: 'volume-up', family: 'material' as const },
  VOLUME_OFF: { name: 'volume-off', family: 'material' as const },
  MUSIC: { name: 'music-note', family: 'material' as const },
  VIBRATION: { name: 'vibration', family: 'material' as const },

  // Space Theme
  ROCKET: { name: 'rocket-launch', family: 'material' as const },
  PLANET: { name: 'public', family: 'material' as const },
  SATELLITE: { name: 'satellite-alt', family: 'material' as const },
  SPACE_STATION: { name: 'space-station', family: 'material-community' as const },

  // Game Status
  CHECK: { name: 'check', family: 'material' as const },
  ERROR: { name: 'error', family: 'material' as const },
  WARNING: { name: 'warning', family: 'material' as const },
  INFO: { name: 'info', family: 'material' as const },

  // Special Effects
  SPARKLES: { name: 'auto-awesome', family: 'material' as const },
  FLASH: { name: 'flash-auto', family: 'material' as const },
  MAGIC: { name: 'magic-staff', family: 'material-community' as const },
} as const;

// Color schemes for different icon contexts
export const ICON_COLORS = {
  PRIMARY: '#00E0FF',      // Neon Cyan
  SECONDARY: '#FFD60A',    // Yellow
  SUCCESS: '#00FF88',      // Green
  WARNING: '#FF9500',      // Orange
  ERROR: '#FF3B30',        // Red
  INFO: '#007AFF',         // Blue
  DISABLED: '#8E8E93',     // Gray
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GOLD: '#FFD700',
  SILVER: '#C0C0C0',
} as const;

// Common icon sizes
export const ICON_SIZES = {
  SMALL: 16,
  MEDIUM: 24,
  LARGE: 32,
  XLARGE: 48,
  XXLARGE: 64,
} as const;