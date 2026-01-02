import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import MaterialIcon from './MaterialIcon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const currentPageData = pages[currentPage];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Page Counter */}
          <View style={styles.pageCounter}>
            <Text style={styles.pageCounterText}>
              {currentPage + 1}/{pages.length}
            </Text>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.iconText}>{
              currentPageData.icon === 'play-circle' ? '🎮' :
              currentPageData.icon === 'touch-app' ? '👆' :
              currentPageData.icon === 'stars' ? '⭐' :
              currentPageData.icon === 'flash-on' ? '⚡' :
              currentPageData.icon === 'shield' ? '🛡️' :
              currentPageData.icon === 'emoji-events' ? '🏆' : '❓'
            }</Text>
            <Text style={styles.title}>{currentPageData.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
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

          {/* Navigation */}
          <View style={styles.navigation}>
            <TouchableOpacity
              onPress={prevPage}
              style={[
                styles.navButton,
                currentPage === 0 && styles.disabledButton,
                currentPage > 0 && styles.navButtonActive
              ]}
              disabled={currentPage === 0}
            >
              <Text style={[styles.navText, currentPage === 0 && styles.disabledText]}>
                ← PREV
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={currentPage === pages.length - 1 ? onClose : nextPage}
              style={[styles.navButton, styles.navButtonActive]}
            >
              <Text style={styles.navText}>
                {currentPage === pages.length - 1 ? "GOT IT! ✓" : "NEXT →"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: 'rgba(5, 5, 10, 0.98)',
    borderTopLeftRadius: 40,
    borderBottomRightRadius: 40,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    width: Math.min(SCREEN_WIDTH - 32, 420),
    maxHeight: SCREEN_HEIGHT * 0.85,
    minHeight: SCREEN_HEIGHT * 0.6,
    borderWidth: 2,
    borderColor: '#00E0FF',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 15,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 224, 255, 0.3)',
  },
  title: {
    flex: 1,
    fontSize: Math.min(SCREEN_WIDTH * 0.05, 22),
    fontWeight: '800',
    color: '#00E0FF',
    marginLeft: 12,
    textShadowColor: 'rgba(0, 224, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  iconText: {
    fontSize: Math.min(SCREEN_WIDTH * 0.08, 32),
    textShadowColor: 'rgba(0, 224, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },
  closeButtonText: {
    color: '#ff4444',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 15,
  },
  contentItem: {
    marginBottom: 14,
    paddingLeft: 8,
  },
  contentText: {
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    lineHeight: Math.min(SCREEN_WIDTH * 0.06, 24),
    color: '#E0E0E0',
    fontWeight: '500',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeIndicator: {
    backgroundColor: '#00E0FF',
    width: 24,
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 224, 255, 0.3)',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 224, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 255, 0.4)',
    minWidth: Math.min(SCREEN_WIDTH * 0.25, 120),
    justifyContent: 'center',
  },
  navButtonActive: {
    backgroundColor: 'rgba(0, 224, 255, 0.2)',
    borderColor: '#00E0FF',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  disabledButton: {
    opacity: 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  navText: {
    fontSize: Math.min(SCREEN_WIDTH * 0.035, 14),
    fontWeight: '700',
    color: '#00E0FF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  disabledText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  pageCounter: {
    position: 'absolute',
    top: 20,
    right: 60,
    backgroundColor: 'rgba(0, 224, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 255, 0.4)',
  },
  pageCounterText: {
    color: '#00E0FF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default InstructionModal;