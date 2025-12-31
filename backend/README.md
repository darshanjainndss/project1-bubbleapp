# Bubble Shooter Backend API

A complete backend system for the Bubble Shooter mobile game built with Node.js, Express, and MongoDB.

## 🚀 Features

- **User Authentication**: Email/password and Google login support
- **Game Data Management**: Store user progress, scores, and statistics
- **Leaderboards**: Global, weekly, and monthly rankings
- **Coins & Abilities**: In-game currency and power-up management
- **Game Sessions**: Track detailed game statistics
- **Achievements**: Unlock achievements based on gameplay
- **RESTful API**: Clean, documented API endpoints

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Update the variables with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/bubble_shooter_db
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   PORT=3000
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # If using MongoDB locally
   mongod
   
   # Or if using MongoDB service
   sudo systemctl start mongod
   ```

5. **Start the server**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 Configuration

### MongoDB Setup
Your MongoDB connection string is: `mongodb://localhost:27017/`

The API will automatically create a database called `bubble_shooter_db` with the following collections:
- `users` - User profiles and game data
- `gamesessions` - Individual game session records

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/bubble_shooter_db` |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `JWT_EXPIRES_IN` | JWT token expiration time | `7d` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |

### Firebase Configuration (Optional - for Google Login)
If you want to enable Google login verification, add these Firebase variables:
```env
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google-login` - Login with Google
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/verify-token` - Verify JWT token

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/game-data` - Get user game data
- `PUT /api/user/game-data` - Update user game data
- `PUT /api/user/coins` - Update user coins
- `PUT /api/user/abilities` - Update user abilities
- `POST /api/user/purchase-abilities` - Purchase abilities with coins
- `GET /api/user/rank` - Get user's current rank
- `GET /api/user/stats` - Get detailed user statistics

### Game Sessions
- `POST /api/game/session` - Submit completed game session
- `GET /api/game/sessions` - Get user's game sessions
- `GET /api/game/level/:level/leaderboard` - Get level leaderboard
- `GET /api/game/level/:level/best-score` - Get user's best score for level

### Leaderboards
- `GET /api/leaderboard` - Get global leaderboard
- `GET /api/leaderboard/weekly` - Get weekly leaderboard
- `GET /api/leaderboard/monthly` - Get monthly leaderboard
- `GET /api/leaderboard/top-players` - Get top players with stats
- `GET /api/leaderboard/stats` - Get leaderboard statistics

### Health Check
- `GET /api/health` - Server health check

## 🎮 Game Integration

### User Registration/Login
```javascript
import BackendService from './src/services/BackendService';

// Register new user
const result = await BackendService.registerUser(email, password, displayName);

// Login user
const result = await BackendService.loginUser(email, password);

// Google login
const result = await BackendService.loginWithGoogle(firebaseId, email, displayName);
```

### Game Data Management
```javascript
// Get user game data
const gameData = await BackendService.getUserGameData();

// Update coins
const result = await BackendService.updateCoins(50, 'add');

// Update abilities
const result = await BackendService.updateAbilities({ lightning: 5, bomb: 3 });
```

### Submit Game Session
```javascript
// Submit completed game
const session = {
  level: 1,
  score: 1250,
  moves: 25,
  stars: 3,
  duration: 120, // seconds
  isWin: true,
  abilitiesUsed: { lightning: 1, bomb: 0, freeze: 0, fire: 1 },
  bubblesDestroyed: 45,
  chainReactions: 8,
  perfectShots: 12
};

const result = await BackendService.submitGameSession(session);
```

### Get Leaderboard
```javascript
// Get global leaderboard
const leaderboard = await BackendService.getLeaderboard(100);

// Get user rank
const rank = await BackendService.getUserRank();
```

## 🏗️ Database Schema

### User Schema
```javascript
{
  email: String,
  password: String, // Hashed
  displayName: String,
  profilePicture: String,
  firebaseId: String,
  isGoogleLogin: Boolean,
  gameData: {
    totalScore: Number,
    highScore: Number,
    totalCoins: Number,
    currentLevel: Number,
    gamesPlayed: Number,
    gamesWon: Number,
    abilities: {
      lightning: Number,
      bomb: Number,
      freeze: Number,
      fire: Number
    },
    achievements: [String],
    lastPlayedAt: Date
  },
  createdAt: Date,
  lastLoginAt: Date,
  isActive: Boolean
}
```

### Game Session Schema
```javascript
{
  sessionId: String,
  userId: ObjectId,
  level: Number,
  score: Number,
  moves: Number,
  stars: Number,
  duration: Number,
  isWin: Boolean,
  abilitiesUsed: {
    lightning: Number,
    bomb: Number,
    freeze: Number,
    fire: Number
  },
  coinsEarned: Number,
  bubblesDestroyed: Number,
  chainReactions: Number,
  perfectShots: Number,
  completedAt: Date
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevent API abuse
- **CORS Protection**: Configurable cross-origin requests
- **Helmet Security**: Security headers
- **Input Validation**: Request validation with express-validator

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Monitoring

The API includes built-in logging and error handling. Monitor your application using:

- Server logs for debugging
- MongoDB logs for database issues
- Health check endpoint for uptime monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the server logs
2. Verify MongoDB connection
3. Ensure all environment variables are set
4. Check API endpoint documentation

For additional support, please create an issue in the repository.