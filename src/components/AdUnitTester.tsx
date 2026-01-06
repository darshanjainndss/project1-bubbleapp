import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Platform } from 'react-native';
import ConfigService from '../services/ConfigService';
import BackendService from '../services/BackendService';

const AdUnitTester: React.FC = () => {
  const [adUnits, setAdUnits] = useState<any>(null);
  const [freshAdUnits, setFreshAdUnits] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Load cached ad units
  const loadCachedAdUnits = async () => {
    setLoading(true);
    try {
      const units = await ConfigService.getAdUnits(false); // Use cache
      setAdUnits(units);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading cached ad units:', error);
      Alert.alert('Error', 'Failed to load cached ad units');
    } finally {
      setLoading(false);
    }
  };

  // Load fresh ad units (bypass cache)
  const loadFreshAdUnits = async () => {
    setLoading(true);
    try {
      const platform = Platform.OS as 'android' | 'ios';
      const result = await BackendService.getFreshAdUnits(platform);
      if (result.success) {
        setFreshAdUnits(result.ads);
      } else {
        Alert.alert('Error', result.error || 'Failed to load fresh ad units');
      }
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading fresh ad units:', error);
      Alert.alert('Error', 'Failed to load fresh ad units');
    } finally {
      setLoading(false);
    }
  };

  // Force refresh cached ad units
  const forceRefreshAdUnits = async () => {
    setLoading(true);
    try {
      const units = await ConfigService.refreshAdUnits();
      setAdUnits(units);
      setLastRefresh(new Date());
      Alert.alert('Success', 'Ad units refreshed from database');
    } catch (error) {
      console.error('Error refreshing ad units:', error);
      Alert.alert('Error', 'Failed to refresh ad units');
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadCachedAdUnits();
  }, []);

  const renderAdUnits = (units: any, title: string) => {
    if (!units) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.adUnitCard}>
          <Text style={styles.adUnitText}>Banner: {units.banner || 'None'}</Text>
          <Text style={styles.adUnitText}>Rewarded: {units.rewarded || 'None'}</Text>
          <Text style={styles.adUnitText}>
            Rewarded List: {units.rewardedList ? units.rewardedList.length : 0} ads
          </Text>
          {units.rewardedList && units.rewardedList.length > 0 && (
            <View style={styles.rewardedList}>
              {units.rewardedList.map((adId: string, index: number) => (
                <Text key={index} style={styles.rewardedItem}>
                  {index + 1}. {adId}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ad Unit Cache Tester</Text>
      <Text style={styles.subtitle}>Platform: {Platform.OS.toUpperCase()}</Text>
      
      {lastRefresh && (
        <Text style={styles.timestamp}>
          Last Refresh: {lastRefresh.toLocaleTimeString()}
        </Text>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.cachedButton]} 
          onPress={loadCachedAdUnits}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Load Cached</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.freshButton]} 
          onPress={loadFreshAdUnits}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Load Fresh</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.refreshButton]} 
          onPress={forceRefreshAdUnits}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Force Refresh</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={async () => {
            setLoading(true);
            try {
              await ConfigService.clearAllCaches();
              const units = await ConfigService.getAdUnits(true);
              setAdUnits(units);
              setLastRefresh(new Date());
              Alert.alert('Success', 'All caches cleared and reloaded');
            } catch (error) {
              console.error('Error clearing caches:', error);
              Alert.alert('Error', 'Failed to clear caches');
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {loading && <Text style={styles.loading}>Loading...</Text>}

      {renderAdUnits(adUnits, 'Cached Ad Units')}
      {renderAdUnits(freshAdUnits, 'Fresh Ad Units (Direct from DB)')}

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>Instructions:</Text>
        <Text style={styles.instructionText}>
          1. "Load Cached" - Uses ConfigService cache (may be stale)
        </Text>
        <Text style={styles.instructionText}>
          2. "Load Fresh" - Bypasses cache, gets latest from DB
        </Text>
        <Text style={styles.instructionText}>
          3. "Force Refresh" - Clears cache and reloads
        </Text>
        <Text style={styles.instructionText}>
          4. Change ad units in database and test the difference
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  timestamp: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    color: '#888',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 2,
    marginVertical: 4,
    minWidth: '22%',
  },
  cachedButton: {
    backgroundColor: '#007AFF',
  },
  freshButton: {
    backgroundColor: '#28a745',
  },
  refreshButton: {
    backgroundColor: '#FFA500',
  },
  clearButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  loading: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginVertical: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  adUnitCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adUnitText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  rewardedList: {
    marginTop: 8,
    paddingLeft: 16,
  },
  rewardedItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  instructions: {
    backgroundColor: '#e9ecef',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#555',
  },
});

export default AdUnitTester;