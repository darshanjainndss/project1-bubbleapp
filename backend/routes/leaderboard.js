const express = require('express');
const User = require('../models/User');
const GameSession = require('../models/GameSession');

const router = express.Router();

// ============================================================================
// ROUTES
// ============================================================================

// @route   GET /api/leaderboard
// @desc    Get global leaderboard
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { limit = 100, type = 'highScore' } = req.query;

    let sortField;
    switch (type) {
      case 'totalScore':
        sortField = { 'gameData.totalScore': -1, 'gameData.highScore': -1 };
        break;
      case 'gamesWon':
        sortField = { 'gameData.gamesWon': -1, 'gameData.highScore': -1 };
        break;
      case 'highScore':
      default:
        sortField = { 'gameData.highScore': -1, 'gameData.totalScore': -1 };
        break;
    }

    const leaderboard = await User.aggregate([
      {
        $match: { 
          isActive: true,
          $or: [
            { 'gameData.gamesPlayed': { $gt: 0 } },
            { 'gameData.highScore': { $gt: 0 } }
          ]
        }
      },
      {
        $sort: sortField
      },
      {
        $project: {
          userId: '$_id',
          email: 1,
          displayName: 1,
          profilePicture: 1,
          highScore: '$gameData.highScore',
          totalScore: '$gameData.totalScore',
          gamesWon: '$gameData.gamesWon',
          gamesPlayed: '$gameData.gamesPlayed',
          currentLevel: '$gameData.currentLevel',
          createdAt: 1
        }
      },
      {
        $addFields: {
          // Use email without @gmail.com as display name
          displayName: {
            $cond: {
              if: { $regexMatch: { input: '$email', regex: /@gmail\.com$/i } },
              then: { $arrayElemAt: [{ $split: ['$email', '@'] }, 0] },
              else: { $arrayElemAt: [{ $split: ['$email', '@'] }, 0] }
            }
          },
          rank: { $add: [{ $indexOfArray: [[], null] }, 1] },
          winRate: {
            $cond: {
              if: { $eq: ['$gamesPlayed', 0] },
              then: 0,
              else: {
                $round: [
                  { $multiply: [{ $divide: ['$gamesWon', '$gamesPlayed'] }, 100] },
                  1
                ]
              }
            }
          }
        }
      },
      {
        // Group by email to remove duplicates, keeping the one with highest score
        $group: {
          _id: '$email',
          userId: { $first: '$userId' },
          displayName: { $first: '$displayName' },
          profilePicture: { $first: '$profilePicture' },
          highScore: { $max: '$highScore' },
          totalScore: { $max: '$totalScore' },
          gamesWon: { $max: '$gamesWon' },
          gamesPlayed: { $max: '$gamesPlayed' },
          currentLevel: { $max: '$currentLevel' },
          createdAt: { $first: '$createdAt' },
          winRate: { $first: '$winRate' }
        }
      },
      {
        $sort: sortField
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          userId: 1,
          displayName: 1,
          profilePicture: 1,
          highScore: 1,
          totalScore: 1,
          gamesWon: 1,
          gamesPlayed: 1,
          currentLevel: 1,
          createdAt: 1,
          winRate: 1,
          _id: 0
        }
      }
    ]);

    // Add rank numbers
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    res.json({
      success: true,
      leaderboard,
      type,
      total: leaderboard.length
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching leaderboard'
    });
  }
});

// @route   GET /api/leaderboard/weekly
// @desc    Get weekly leaderboard
// @access  Public
router.get('/weekly', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    // Get date from 7 days ago
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyLeaderboard = await GameSession.aggregate([
      {
        $match: {
          completedAt: { $gte: weekAgo },
          isWin: true
        }
      },
      {
        $group: {
          _id: '$userId',
          totalScore: { $sum: '$score' },
          highScore: { $max: '$score' },
          gamesWon: { $sum: 1 },
          gamesPlayed: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $match: {
          'user.isActive': true
        }
      },
      {
        $project: {
          userId: '$_id',
          email: '$user.email',
          displayName: '$user.displayName',
          profilePicture: '$user.profilePicture',
          totalScore: 1,
          highScore: 1,
          gamesWon: 1,
          gamesPlayed: 1
        }
      },
      {
        $addFields: {
          // Use email without @gmail.com as display name
          displayName: {
            $cond: {
              if: { $regexMatch: { input: '$email', regex: /@gmail\.com$/i } },
              then: { $arrayElemAt: [{ $split: ['$email', '@'] }, 0] },
              else: { $arrayElemAt: [{ $split: ['$email', '@'] }, 0] }
            }
          }
        }
      },
      {
        // Group by email to remove duplicates, keeping the one with highest score
        $group: {
          _id: '$email',
          userId: { $first: '$userId' },
          displayName: { $first: '$displayName' },
          profilePicture: { $first: '$profilePicture' },
          totalScore: { $max: '$totalScore' },
          highScore: { $max: '$highScore' },
          gamesWon: { $max: '$gamesWon' },
          gamesPlayed: { $max: '$gamesPlayed' }
        }
      },
      {
        $sort: { totalScore: -1, highScore: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          userId: 1,
          displayName: 1,
          profilePicture: 1,
          totalScore: 1,
          highScore: 1,
          gamesWon: 1,
          gamesPlayed: 1,
          _id: 0
        }
      }
    ]);

    // Add rank numbers
    weeklyLeaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    res.json({
      success: true,
      leaderboard: weeklyLeaderboard,
      period: 'weekly',
      total: weeklyLeaderboard.length
    });

  } catch (error) {
    console.error('Get weekly leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching weekly leaderboard'
    });
  }
});

// @route   GET /api/leaderboard/monthly
// @desc    Get monthly leaderboard
// @access  Public
router.get('/monthly', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    // Get date from 30 days ago
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const monthlyLeaderboard = await GameSession.aggregate([
      {
        $match: {
          completedAt: { $gte: monthAgo },
          isWin: true
        }
      },
      {
        $group: {
          _id: '$userId',
          totalScore: { $sum: '$score' },
          highScore: { $max: '$score' },
          gamesWon: { $sum: 1 },
          gamesPlayed: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $match: {
          'user.isActive': true
        }
      },
      {
        $project: {
          userId: '$_id',
          email: '$user.email',
          displayName: '$user.displayName',
          profilePicture: '$user.profilePicture',
          totalScore: 1,
          highScore: 1,
          gamesWon: 1,
          gamesPlayed: 1
        }
      },
      {
        $addFields: {
          // Use email without @gmail.com as display name
          displayName: {
            $cond: {
              if: { $regexMatch: { input: '$email', regex: /@gmail\.com$/i } },
              then: { $arrayElemAt: [{ $split: ['$email', '@'] }, 0] },
              else: { $arrayElemAt: [{ $split: ['$email', '@'] }, 0] }
            }
          }
        }
      },
      {
        // Group by email to remove duplicates, keeping the one with highest score
        $group: {
          _id: '$email',
          userId: { $first: '$userId' },
          displayName: { $first: '$displayName' },
          profilePicture: { $first: '$profilePicture' },
          totalScore: { $max: '$totalScore' },
          highScore: { $max: '$highScore' },
          gamesWon: { $max: '$gamesWon' },
          gamesPlayed: { $max: '$gamesPlayed' }
        }
      },
      {
        $sort: { totalScore: -1, highScore: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          userId: 1,
          displayName: 1,
          profilePicture: 1,
          totalScore: 1,
          highScore: 1,
          gamesWon: 1,
          gamesPlayed: 1,
          _id: 0
        }
      }
    ]);

    // Add rank numbers
    monthlyLeaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    res.json({
      success: true,
      leaderboard: monthlyLeaderboard,
      period: 'monthly',
      total: monthlyLeaderboard.length
    });

  } catch (error) {
    console.error('Get monthly leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching monthly leaderboard'
    });
  }
});

// @route   GET /api/leaderboard/friends/:userId
// @desc    Get friends leaderboard (placeholder - requires friends system)
// @access  Public
router.get('/friends/:userId', async (req, res) => {
  try {
    // This is a placeholder for friends leaderboard
    // You would need to implement a friends system first
    
    res.json({
      success: true,
      message: 'Friends leaderboard not implemented yet',
      leaderboard: [],
      total: 0
    });

  } catch (error) {
    console.error('Get friends leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching friends leaderboard'
    });
  }
});

// @route   GET /api/leaderboard/top-players
// @desc    Get top players with detailed stats
// @access  Public
router.get('/top-players', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topPlayers = await User.aggregate([
      {
        $match: { 
          isActive: true,
          'gameData.gamesPlayed': { $gte: 5 } // At least 5 games played
        }
      },
      {
        $addFields: {
          winRate: {
            $cond: {
              if: { $eq: ['$gameData.gamesPlayed', 0] },
              then: 0,
              else: {
                $divide: ['$gameData.gamesWon', '$gameData.gamesPlayed']
              }
            }
          },
          averageScore: {
            $cond: {
              if: { $eq: ['$gameData.gamesPlayed', 0] },
              then: 0,
              else: {
                $divide: ['$gameData.totalScore', '$gameData.gamesPlayed']
              }
            }
          }
        }
      },
      {
        $sort: { 
          'gameData.highScore': -1, 
          winRate: -1,
          'gameData.totalScore': -1 
        }
      },
      {
        $project: {
          email: 1,
          displayName: 1,
          profilePicture: 1,
          highScore: '$gameData.highScore',
          totalScore: '$gameData.totalScore',
          gamesWon: '$gameData.gamesWon',
          gamesPlayed: '$gameData.gamesPlayed',
          currentLevel: '$gameData.currentLevel',
          winRate: { $multiply: ['$winRate', 100] },
          averageScore: { $round: ['$averageScore', 0] },
          createdAt: 1
        }
      },
      {
        $addFields: {
          // Use email without @gmail.com as display name
          displayName: {
            $cond: {
              if: { $regexMatch: { input: '$email', regex: /@gmail\.com$/i } },
              then: { $arrayElemAt: [{ $split: ['$email', '@'] }, 0] },
              else: { $arrayElemAt: [{ $split: ['$email', '@'] }, 0] }
            }
          }
        }
      },
      {
        // Group by email to remove duplicates, keeping the one with highest score
        $group: {
          _id: '$email',
          displayName: { $first: '$displayName' },
          profilePicture: { $first: '$profilePicture' },
          highScore: { $max: '$highScore' },
          totalScore: { $max: '$totalScore' },
          gamesWon: { $max: '$gamesWon' },
          gamesPlayed: { $max: '$gamesPlayed' },
          currentLevel: { $max: '$currentLevel' },
          winRate: { $first: '$winRate' },
          averageScore: { $first: '$averageScore' },
          createdAt: { $first: '$createdAt' }
        }
      },
      {
        $sort: { 
          highScore: -1, 
          winRate: -1,
          totalScore: -1 
        }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          displayName: 1,
          profilePicture: 1,
          highScore: 1,
          totalScore: 1,
          gamesWon: 1,
          gamesPlayed: 1,
          currentLevel: 1,
          winRate: 1,
          averageScore: 1,
          createdAt: 1,
          _id: 0
        }
      }
    ]);

    // Add rank numbers
    topPlayers.forEach((player, index) => {
      player.rank = index + 1;
      player.winRate = Math.round(player.winRate * 10) / 10; // Round to 1 decimal
    });

    res.json({
      success: true,
      topPlayers,
      total: topPlayers.length
    });

  } catch (error) {
    console.error('Get top players error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching top players'
    });
  }
});

// @route   GET /api/leaderboard/stats
// @desc    Get leaderboard statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: null,
          totalPlayers: { $sum: 1 },
          activePlayers: {
            $sum: {
              $cond: [{ $gt: ['$gameData.gamesPlayed', 0] }, 1, 0]
            }
          },
          totalGamesPlayed: { $sum: '$gameData.gamesPlayed' },
          totalScore: { $sum: '$gameData.totalScore' },
          highestScore: { $max: '$gameData.highScore' },
          averageScore: { $avg: '$gameData.totalScore' },
          totalWins: { $sum: '$gameData.gamesWon' }
        }
      },
      {
        $project: {
          _id: 0,
          totalPlayers: 1,
          activePlayers: 1,
          totalGamesPlayed: 1,
          totalScore: 1,
          highestScore: 1,
          averageScore: { $round: ['$averageScore', 0] },
          totalWins: 1,
          globalWinRate: {
            $cond: {
              if: { $eq: ['$totalGamesPlayed', 0] },
              then: 0,
              else: {
                $round: [
                  { $multiply: [{ $divide: ['$totalWins', '$totalGamesPlayed'] }, 100] },
                  1
                ]
              }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalPlayers: 0,
        activePlayers: 0,
        totalGamesPlayed: 0,
        totalScore: 0,
        highestScore: 0,
        averageScore: 0,
        totalWins: 0,
        globalWinRate: 0
      }
    });

  } catch (error) {
    console.error('Get leaderboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching leaderboard statistics'
    });
  }
});

module.exports = router;