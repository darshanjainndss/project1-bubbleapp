import React from 'react';
import { StyleProp, TextStyle, Text } from 'react-native';

// Try to import vector icons, but provide fallbacks
let MaterialIcons: any;
let MaterialCommunityIcons: any;
let Ionicons: any;
let FontAwesome: any;
let FontAwesome5: any;

try {
  MaterialIcons = require('react-native-vector-icons/MaterialIcons').default;
  MaterialCommunityIcons = require('react-native-vector-icons/MaterialCommunityIcons').default;
  Ionicons = require('react-native-vector-icons/Ionicons').default;
  FontAwesome = require('react-native-vector-icons/FontAwesome').default;
  FontAwesome5 = require('react-native-vector-icons/FontAwesome5').default;
} catch (error) {
  console.warn('Vector icons not properly linked:', error);
}

export type IconFamily = 'material' | 'material-community' | 'ionicons' | 'fontawesome' | 'fontawesome5';

interface MaterialIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  family?: IconFamily;
}

// Fallback icon mappings to emoji/text
const FALLBACK_ICONS: Record<string, string> = {
  'home': '🏠',
  'close': '✕',
  'star': '⭐',
  'star-border': '☆',
  'flash-on': '⚡',
  'ac-unit': '❄️',
  'whatshot': '🔥',
  'bomb': '💣',
  'monetization-on': '🪙',
  'leaderboard': '🏆',
  'person': '👤',
  'refresh': '🔄',
  'skip-next': '⏭️',
  'arrow-back': '←',
  'menu': '☰',
  'settings': '⚙️',
  'trophy': '🏆',
  'emoji-events': '🏆',
  'group': '👥',
  'public': '🌍',
  'add-shopping-cart': '🛒',
  'shopping-cart': '🛒',
  'sports_score': '🎯',
  'trending-up': '📈',
  'play-arrow': '▶️',
  'email': '📧',
  'lock': '🔒',
  'person-add': '👤+',
  'login': '🚪',
  'google': 'G',
  'account-circle': '👤',
};

const MaterialIcon: React.FC<MaterialIconProps> = ({
  name,
  size = 24,
  color = '#000',
  style,
  family = 'material'
}) => {
  // If vector icons are available, use them
  if (MaterialIcons && MaterialCommunityIcons && Ionicons && FontAwesome && FontAwesome5) {
    try {
      const IconComponent = {
        'material': MaterialIcons,
        'material-community': MaterialCommunityIcons,
        'ionicons': Ionicons,
        'fontawesome': FontAwesome,
        'fontawesome5': FontAwesome5,
      }[family];

      return (
        <IconComponent
          name={name}
          size={size}
          color={color}
          style={style}
        />
      );
    } catch (error) {
      console.warn('Icon render error:', error);
    }
  }

  // Fallback to emoji/text
  const fallbackIcon = FALLBACK_ICONS[name] || '?';
  return (
    <Text style={[{ fontSize: size, color }, style]}>
      {fallbackIcon}
    </Text>
  );
};

export default MaterialIcon;