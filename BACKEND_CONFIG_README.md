# Backend-Driven Configuration Implementation

This document explains the implementation of backend-driven abilities and ad configuration for the Bubble Shooter game.

## 🎯 Overview

The game now loads abilities and ad configurations dynamically from the backend instead of using hardcoded values in the frontend. This allows for:

- **Dynamic ability management**: Add, modify, or remove abilities without app updates
- **Flexible ad configuration**: Change ad unit IDs and settings remotely
- **A/B testing capabilities**: Test different ability prices and effects
- **Platform-specific configurations**: Different settings for Android and iOS
- **Environment-specific ads**: Separate test and production ad units

## 🏗️ Architecture

### Backend Components

1. **Models**:
   - `Ability.js`: Defines ability properties (name, price, effect, etc.)
   - `AdConfig.js`: Defines ad configuration for different platforms
   - `User.js`: Updated to use dynamic abilities map

2. **Routes**:
   - `GET /api/config/abilities`: Get all abilities
   - `GET /api/config/ads`: Get ad configuration for platform
   - `GET /api/config/game`: Get complete game configuration

3. **Seeder**:
   - `seedGameConfig.js`: Populates database with initial abilities and ad configs

### Frontend Components

1. **Services**:
   - `ConfigService.ts`: Manages configuration loading and caching
   - `BackendService.ts`: Updated with config API methods
   - `admob.ts`: Updated to use dynamic ad configuration

2. **Caching**:
   - 24-hour cache duration for configurations
   - Fallback to hardcoded values if backend unavailable
   - Automatic cache invalidation and refresh

## 📊 Database Schema

### Abilities Collection
```javascript
{
  name: "lightning",                    // Unique identifier
  displayName: "Lightning",             // Display name
  description: "Destroys entire row",   // Description
  icon: "lightning-bolt",               // Icon identifier
  effect: "destroyRow",                 // Game effect type
  pointsPerBubble: 15,                  // Points per bubble destroyed
  price: 50,                            // Cost in coins
  startingCount: 2,                     // Starting inventory count
  sortOrder: 1,                         // Display order
  isActive: true                        // Enable/disable ability
}
```

### Ad Configuration Collection
```javascript
{
  platform: "android",                 // Platform (android/ios)
  appId: "ca-app-pub-xxx~xxx",         // AdMob App ID
  bannerAdUnitId: {
    production: "ca-app-pub-xxx/xxx",   // Production banner ID
    test: "ca-app-pub-xxx/xxx"          // Test banner ID
  },
  rewardedAdUnitId: {
    production: "ca-app-pub-xxx/xxx",   // Production rewarded ID
    test: "ca-app-pub-xxx/xxx"          // Test rewarded ID
  },
  maxAdContentRating: "G",              // Content rating
  rewardConfig: {
    coinsPerAd: 25,                     // Coins earned per ad
    abilitiesPerAd: 1                   // Abilities earned per ad
  }
}
```

### User Abilities (Updated)
```javascript
{
  gameData: {
    abilities: Map {                    // Dynamic abilities map
      "lightning" => 5,                 // Ability count
      "bomb" => 3,
      "freeze" => 2,
      "fire" => 4
    }
  }
}
```

## 🚀 Setup Instructions

### 1. Backend Setup

1. **Install Dependencies** (if not already done):
   ```bash
   cd backend
   npm install
   ```

2. **Seed the Database**:
   ```bash
   npm run seed
   ```

3. **Start the Server**:
   ```bash
   npm start
   ```

### 2. Frontend Integration

The frontend automatically loads configuration from the backend. No additional setup required.

### 3. Verify Implementation

Test the API endpoints:

```bash
# Test abilities config
curl http://localhost:3001/api/config/abilities

# Test ad config (development)
curl "http://localhost:3001/api/config/ads?platform=android&dev=true"

# Test ad config (production)
curl "http://localhost:3001/api/config/ads?platform=android&dev=false"

# Test complete game config
curl "http://localhost:3001/api/config/game?platform=android&dev=true"
```

## 🔧 Configuration Management

### Adding New Abilities

1. **Via Database**:
   ```javascript
   // Add to MongoDB directly
   db.abilities.insertOne({
     name: "newAbility",
     displayName: "New Ability",
     description: "Does something cool",
     icon: "star",
     effect: "customEffect",
     pointsPerBubble: 20,
     price: 100,
     startingCount: 1,
     sortOrder: 5,
     isActive: true
   });
   ```

2. **Via Seeder** (recommended):
   - Update `backend/seeders/seedGameConfig.js`
   - Add new ability to `abilitiesData` array
   - Run `npm run seed`

### Updating Ad Configuration

1. **Change Ad Unit IDs**:
   ```javascript
   // Update in MongoDB
   db.adconfigs.updateOne(
     { platform: "android" },
     { 
       $set: { 
         "bannerAdUnitId.production": "new-banner-id",
         "rewardedAdUnitId.production": "new-rewarded-id"
       }
     }
   );
   ```

2. **Update Reward Values**:
   ```javascript
   db.adconfigs.updateOne(
     { platform: "android" },
     { 
       $set: { 
         "rewardConfig.coinsPerAd": 50,
         "rewardConfig.abilitiesPerAd": 2
       }
     }
   );
   ```

### Disabling Abilities

```javascript
// Disable an ability
db.abilities.updateOne(
  { name: "lightning" },
  { $set: { isActive: false } }
);
```

## 📱 Frontend Usage

### Loading Configuration

```typescript
import ConfigService from './src/services/ConfigService';

// Get abilities
const abilities = await ConfigService.getAbilitiesConfig();

// Get ad config
const adConfig = await ConfigService.getAdConfig();

// Get complete game config
const gameConfig = await ConfigService.getGameConfig();

// Force refresh (bypass cache)
await ConfigService.refreshConfig();
```

### Using Dynamic Abilities

```typescript
// Get ability price
const lightningPrice = await ConfigService.getAbilityPrice('lightning');

// Get ability starting count
const startingCount = await ConfigService.getAbilityStartingCount('fire');

// Get specific ability details
const bombAbility = await ConfigService.getAbilityByName('bomb');
```

## 🔄 Migration from Hardcoded Values

### Before (Hardcoded)
```typescript
// Old hardcoded abilities
const abilities = {
  lightning: { price: 50, startingCount: 2 },
  bomb: { price: 75, startingCount: 2 }
};

// Old hardcoded ad IDs
const ADMOB_CONFIG = {
  BANNER_AD_UNIT_ID: 'ca-app-pub-xxx/xxx',
  REWARDED_AD_UNIT_ID: 'ca-app-pub-xxx/xxx'
};
```

### After (Dynamic)
```typescript
// New dynamic abilities
const abilities = await ConfigService.getAbilitiesConfig();
const lightningAbility = abilities.find(a => a.name === 'lightning');

// New dynamic ad config
const adConfig = await ConfigService.getAdConfig();
const bannerAdId = adConfig.bannerAdUnitId;
```

## 🛡️ Fallback Strategy

The system includes comprehensive fallback mechanisms:

1. **Cache Fallback**: Uses 24-hour cached data if backend unavailable
2. **Hardcoded Fallback**: Falls back to hardcoded values if cache and backend fail
3. **Graceful Degradation**: App continues to work even if config loading fails

## 🧪 Testing

### API Testing
```bash
# Test all endpoints
curl http://localhost:3001/api/config/abilities
curl "http://localhost:3001/api/config/ads?platform=android&dev=true"
curl "http://localhost:3001/api/config/game?platform=android&dev=true"
```

### Frontend Testing
```typescript
// Test config loading
const config = await ConfigService.getGameConfig();
console.log('Loaded config:', config);

// Test cache behavior
await ConfigService.refreshConfig(); // Force refresh
const newConfig = await ConfigService.getGameConfig(); // Should fetch from backend
```

## 🔮 Future Enhancements

1. **Admin Panel**: Web interface for managing abilities and ad configs
2. **A/B Testing**: Support for multiple config variants
3. **Real-time Updates**: WebSocket-based config updates
4. **Analytics Integration**: Track ability usage and ad performance
5. **Localization**: Multi-language ability names and descriptions

## 🐛 Troubleshooting

### Common Issues

1. **Config Not Loading**:
   - Check backend server is running
   - Verify database connection
   - Check network connectivity

2. **Cache Issues**:
   - Clear app cache: `ConfigService.refreshConfig()`
   - Check cache timestamp in AsyncStorage

3. **Ad Issues**:
   - Verify ad unit IDs are correct
   - Check platform parameter (android/ios)
   - Ensure dev parameter matches environment

### Debug Logs

Enable debug logging:
```typescript
// In ConfigService
console.log('Loading config from backend...');
console.log('Using cached config...');
console.log('Falling back to hardcoded config...');
```

## 📈 Benefits Achieved

✅ **Flexibility**: Change abilities and ads without app updates  
✅ **Scalability**: Easy to add new abilities and configurations  
✅ **Testing**: A/B test different prices and effects  
✅ **Platform Support**: Separate configs for Android and iOS  
✅ **Environment Support**: Different settings for dev and production  
✅ **Reliability**: Comprehensive fallback mechanisms  
✅ **Performance**: Efficient caching reduces API calls  
✅ **Maintainability**: Centralized configuration management  

The implementation successfully moves abilities and ad configuration from hardcoded frontend values to a flexible, backend-driven system that supports dynamic updates, testing, and platform-specific configurations.