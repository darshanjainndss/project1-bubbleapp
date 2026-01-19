import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import BaseModal from './BaseModal';
import { ICON_COLORS } from '../../config/icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface InstructionModalProps {
  visible: boolean;
  onClose: () => void;
}

const InstructionModal: React.FC<InstructionModalProps> = ({ visible, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);

  const pages = [
    {
      title: "WELCOME TO BUBBLE SHOOTER!",
      content: [
        "🎯 MISSION: Clear all bubbles from the cosmic grid",
        "🔫 AIM & SHOOT: Create powerful bubble matches",
        "💥 DESTROY: Match 3+ bubbles of the same color",
        "⭐ ACHIEVE: Earn up to 3 stars per level",
        "🚀 READY: Let's begin your space adventure!"
      ],
      icon: "play-circle"
    },
    {
      title: "MASTER THE CONTROLS",
      content: [
        "👆 TOUCH & DRAG: Aim your cosmic cannon",
        "🎯 RELEASE: Fire the bubble into space",
        "🔄 PHYSICS: Bubbles bounce off asteroid walls",
        "📍 LANDING: Auto-lands in the nearest grid spot",
        "⚡ SPEED: Faster shots = better precision!"
      ],
      icon: "touch-app"
    },
    {
      title: "SCORING & STRATEGY",
      content: [
        "🎨 MATCH 3+: Same color bubbles explode",
        "💥 CHAIN REACTION: Destroyed bubbles disappear",
        "🪐 FLOATING: Unconnected bubbles fall into space",
        "📊 POINTS: More destruction = higher score",
        "🎯 BONUS: Floating bubbles give extra points!"
      ],
      icon: "stars"
    },
    {
      title: "LEVEL PROGRESSION",
      content: [
        "🔓 UNLOCK RULE: You need 2 STARS to advance",
        "⭐ REQUIREMENT: 1 Star = Level Passed but stuck",
        "⭐⭐ REQUIREMENT: 2 Stars = Next Level Unlocked!",
        "🚫 STUCK?: Replay previous levels to get better scores",
        "📈 JOURNEY: Advance through 2000 levels!"
      ],
      icon: "trending-up"
    },
    {
      title: "POWER-UP ARSENAL",
      content: [
        "⚡ LIGHTNING: Obliterates entire cosmic row",
        "💣 BOMB: Destroys target + all neighbors",
        "🧊 FREEZE: Temporarily stops time flow",
        "🔥 FIRE: Burns through multiple bubbles",
        "🎁 COLLECT: Gather power-ups during missions!"
      ],
      icon: "flash-on"
    },
    {
      title: "SPECIAL OBSTACLES",
      content: [
        "🛡️ METAL GRID: Requires 2 direct hits",
        "❄️ FROZEN: Cannot be moved or matched",
        "💎 COLORS: Plan strategic combinations",
        "🎯 TACTICS: Create devastating chain reactions!",
        "🧠 THINK: Every shot counts in space!"
      ],
      icon: "shield"
    },
    {
      title: "VICTORY CONDITIONS",
      content: [
        "🏆 VICTORY: Clear all bubbles from space",
        "💔 DEFEAT: Run out of ammunition",
        "🎯 STRATEGY: Limited shots - make them count!",
        "⭐ STAR RATINGS:",
        "   • ⭐ Bronze: 100+ points",
        "   • ⭐⭐ Silver: 500+ points",
        "   • ⭐⭐⭐ Gold: 1000+ points"
      ],
      icon: "emoji-events"
    }
  ];

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      onClose();
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const currentPageData = pages[currentPage];

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title={currentPageData.title}
      icon={currentPageData.icon}
      iconColor={ICON_COLORS.PRIMARY}
      showCloseButton={true}
      primaryAction={{
        label: currentPage === pages.length - 1 ? "GOT IT! ✓" : "NEXT →",
        onPress: nextPage,
      }}
      secondaryAction={currentPage > 0 ? {
        label: "← PREV",
        onPress: prevPage,
      } : undefined}
    >
      <View style={styles.container}>
        {/* Page Counter */}
        <View style={styles.pageCounter}>
          <Text style={styles.pageCounterText}>
            {currentPage + 1}/{pages.length}
          </Text>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 10 }}
        >
          {currentPageData.content.map((item, index) => (
            <View key={index} style={styles.contentItem}>
              <Text style={styles.contentText}>{item}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Page Indicators */}
        <View style={styles.pageIndicators}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentPage && styles.activeIndicator
              ]}
            />
          ))}
        </View>
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 400,
  },
  pageCounter: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 224, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 10,
  },
  pageCounterText: {
    color: '#00E0FF',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    marginBottom: 15,
  },
  contentItem: {
    marginBottom: 12,
    paddingLeft: 4,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#E0E0E0',
    fontWeight: '500',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeIndicator: {
    backgroundColor: '#00E0FF',
    width: 18,
  },
});

export default InstructionModal;