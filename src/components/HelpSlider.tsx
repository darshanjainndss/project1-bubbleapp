import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StyleSheet,
  Modal,
} from 'react-native';
import MaterialIcon from './MaterialIcon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HelpSliderProps {
  visible: boolean;
  onClose: () => void;
}

const HelpSlider: React.FC<HelpSliderProps> = ({ visible, onClose }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const categories = [
    {
      title: "CORE MISSION",
      icon: "rocket-launch",
      color: "#00E0FF",
      items: [
        "Clear all bubbles from the cosmic grid to win.",
        "Match 3 or more bubbles of the same color.",
        "Unconnected bubbles will fall into the void.",
        "Earn up to 3 stars based on your score."
      ]
    },
    {
      title: "CANNON CONTROLS",
      icon: "gps-fixed",
      color: "#FFD60A",
      items: [
        "Touch and Drag anywhere to aim.",
        "Release to fire the cosmic bubble.",
        "Bubbles bounce off the orbital walls.",
        "Plan your shots to trigger cascades."
      ]
    },
    {
      title: "EXTREME ABILITIES",
      icon: "auto-fix-high",
      color: "#FF3B30",
      items: [
        "LIGHTNING: Clears a horizontal row.",
        "BOMB: Explodes everything nearby.",
        "FREEZE: Halts all orbital movement.",
        "FIRE: Pierces through multiple layers."
      ]
    },
    {
      title: "OBSTACLES",
      icon: "security",
      color: "#34C759",
      items: [
        "METAL GRIDS: Require two direct hits.",
        "ICE BLOCKS: Must be shattered first.",
        "VOID SPACE: Obstacles can shift mid-game.",
        "Plan your strategy around these hazards."
      ]
    }
  ];

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>MISSION BRIEFING</Text>
              <View style={styles.underline} />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcon name="close" family="material" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {categories.map((cat, idx) => (
              <View key={idx} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: `${cat.color}20`, borderColor: cat.color }]}>
                    <MaterialIcon name={cat.icon} family="material" size={20} color={cat.color} />
                  </View>
                  <Text style={[styles.categoryTitle, { color: cat.color }]}>{cat.title}</Text>
                </View>

                <View style={styles.itemsList}>
                  {cat.items.map((item, iIdx) => (
                    <View key={iIdx} style={styles.itemRow}>
                      <View style={[styles.bullet, { backgroundColor: cat.color }]} />
                      <Text style={styles.itemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <View style={styles.footerInfo}>
              <MaterialIcon name="info-outline" family="material" size={16} color="rgba(255,255,255,0.4)" />
              <Text style={styles.footerText}>Every mission consumes 1 energy core.</Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.bottomBtn} onPress={onClose}>
            <Text style={styles.bottomBtnText}>I UNDERSTAND</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 5, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 450,
    maxHeight: SCREEN_HEIGHT * 0.85,
    backgroundColor: '#0A0F20',
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 224, 255, 0.4)',
    overflow: 'hidden',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: '#00E0FF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 224, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  underline: {
    width: 40,
    height: 3,
    backgroundColor: '#00E0FF',
    marginTop: 4,
    borderRadius: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  scrollContent: {
    padding: 25,
  },
  categoryCard: {
    marginBottom: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
    opacity: 0.8,
  },
  itemText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    flex: 1,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBtn: {
    backgroundColor: '#00E0FF',
    margin: 25,
    marginTop: 15,
    height: 55,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  bottomBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default HelpSlider;