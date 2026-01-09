import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { Platform } from 'react-native';
import ConfigService from '../services/ConfigService';

interface AdConfigData {
  _id: string;
  platform: 'android' | 'ios';
  appId: string;
  maxAdContentRating: 'G' | 'PG' | 'T' | 'MA';
  tagForUnderAgeOfConsent: boolean;
  tagForChildDirectedTreatment: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdUnitData {
  _id: string;
  adId: string;
  adType: 'banner' | 'rewarded';
  platform: 'android' | 'ios';
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ConfigManager: React.FC = () => {
  const [adConfigs, setAdConfigs] = useState<AdConfigData[]>([]);
  const [adUnits, setAdUnits] = useState<AdUnitData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AdConfigData | null>(null);
  const [editingUnit, setEditingUnit] = useState<AdUnitData | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadAdConfigs(), loadAdUnits()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdConfigs = async () => {
    try {
      const result = await ConfigService.getAllAdConfigs();
      if (result.success && result.data) {
        setAdConfigs(result.data);
      } else {
        Alert.alert('Error', result.error || 'Failed to load ad configurations');
      }
    } catch (error) {
      console.error('Error loading ad configs:', error);
    }
  };

  const loadAdUnits = async () => {
    try {
      const result = await ConfigService.getAllAdUnits();
      if (result.success && result.data) {
        setAdUnits(result.data);
      } else {
        Alert.alert('Error', result.error || 'Failed to load ad units');
      }
    } catch (error) {
      console.error('Error loading ad units:', error);
    }
  };

  const handleInitializeConfigs = async () => {
    setLoading(true);
    try {
      const result = await ConfigService.initializeAdConfigs();
      if (result.success) {
        Alert.alert('Success', 'Ad configurations initialized successfully');
        await loadAdConfigs();
      } else {
        Alert.alert('Error', result.error || 'Failed to initialize ad configurations');
      }
    } catch (error) {
      console.error('Error initializing configs:', error);
      Alert.alert('Error', 'Failed to initialize ad configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeUnits = async () => {
    setLoading(true);
    try {
      const result = await ConfigService.initializeAdUnits();
      if (result.success) {
        Alert.alert('Success', 'Ad units initialized successfully');
        await loadAdUnits();
      } else {
        Alert.alert('Error', result.error || 'Failed to initialize ad units');
      }
    } catch (error) {
      console.error('Error initializing units:', error);
      Alert.alert('Error', 'Failed to initialize ad units');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (platform: 'android' | 'ios', updates: any) => {
    setLoading(true);
    try {
      const result = await ConfigService.updateAdConfig(platform, updates);
      if (result.success) {
        Alert.alert('Success', 'Ad configuration updated successfully');
        await loadAdConfigs();
        setEditingConfig(null);
      } else {
        Alert.alert('Error', result.error || 'Failed to update ad configuration');
      }
    } catch (error) {
      console.error('Error updating config:', error);
      Alert.alert('Error', 'Failed to update ad configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUnit = async (id: string, updates: any) => {
    setLoading(true);
    try {
      const result = await ConfigService.updateAdUnit(id, updates);
      if (result.success) {
        Alert.alert('Success', 'Ad unit updated successfully');
        await loadAdUnits();
        setEditingUnit(null);
      } else {
        Alert.alert('Error', result.error || 'Failed to update ad unit');
      }
    } catch (error) {
      console.error('Error updating unit:', error);
      Alert.alert('Error', 'Failed to update ad unit');
    } finally {
      setLoading(false);
    }
  };

  const renderAdConfig = (config: AdConfigData) => (
    <View key={config._id} style={styles.configCard}>
      <View style={styles.configHeader}>
        <Text style={styles.configTitle}>{config.platform.toUpperCase()} Config</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditingConfig(config)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.configDetail}>App ID: {config.appId}</Text>
      <Text style={styles.configDetail}>Rating: {config.maxAdContentRating}</Text>
      <Text style={styles.configDetail}>Active: {config.isActive ? 'Yes' : 'No'}</Text>
      <Text style={styles.configDetail}>Under Age Consent: {config.tagForUnderAgeOfConsent ? 'Yes' : 'No'}</Text>
      <Text style={styles.configDetail}>Child Directed: {config.tagForChildDirectedTreatment ? 'Yes' : 'No'}</Text>
    </View>
  );

  const renderAdUnit = (unit: AdUnitData) => (
    <View key={unit._id} style={styles.unitCard}>
      <View style={styles.configHeader}>
        <Text style={styles.unitTitle}>{unit.platform.toUpperCase()} {unit.adType}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditingUnit(unit)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.configDetail}>Ad ID: {unit.adId}</Text>
      <Text style={styles.configDetail}>Priority: {unit.priority}</Text>
      <Text style={styles.configDetail}>Active: {unit.isActive ? 'Yes' : 'No'}</Text>
    </View>
  );

  const renderEditConfigModal = () => {
    if (!editingConfig) return null;

    return (
      <View style={styles.modal}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit {editingConfig.platform.toUpperCase()} Config</Text>
          
          <Text style={styles.label}>App ID:</Text>
          <TextInput
            style={styles.input}
            value={editingConfig.appId}
            onChangeText={(text) => setEditingConfig({...editingConfig, appId: text})}
            placeholder="Enter App ID"
          />

          <Text style={styles.label}>Max Content Rating:</Text>
          <View style={styles.ratingButtons}>
            {['G', 'PG', 'T', 'MA'].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.ratingButton,
                  editingConfig.maxAdContentRating === rating && styles.selectedRating
                ]}
                onPress={() => setEditingConfig({
                  ...editingConfig,
                  maxAdContentRating: rating as 'G' | 'PG' | 'T' | 'MA'
                })}
              >
                <Text style={styles.ratingButtonText}>{rating}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Active:</Text>
            <Switch
              value={editingConfig.isActive}
              onValueChange={(value) => setEditingConfig({...editingConfig, isActive: value})}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Under Age Consent:</Text>
            <Switch
              value={editingConfig.tagForUnderAgeOfConsent}
              onValueChange={(value) => setEditingConfig({...editingConfig, tagForUnderAgeOfConsent: value})}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Child Directed:</Text>
            <Switch
              value={editingConfig.tagForChildDirectedTreatment}
              onValueChange={(value) => setEditingConfig({...editingConfig, tagForChildDirectedTreatment: value})}
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setEditingConfig(null)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleUpdateConfig(editingConfig.platform, {
                appId: editingConfig.appId,
                maxAdContentRating: editingConfig.maxAdContentRating,
                isActive: editingConfig.isActive,
                tagForUnderAgeOfConsent: editingConfig.tagForUnderAgeOfConsent,
                tagForChildDirectedTreatment: editingConfig.tagForChildDirectedTreatment,
              })}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Configuration Manager</Text>
      
      {loading && <Text style={styles.loading}>Loading...</Text>}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleInitializeConfigs}>
          <Text style={styles.actionButtonText}>Initialize Ad Configs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleInitializeUnits}>
          <Text style={styles.actionButtonText}>Initialize Ad Units</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={loadAllData}>
          <Text style={styles.actionButtonText}>Refresh Data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={async () => {
          setLoading(true);
          try {
            await ConfigService.refreshAdUnits();
            Alert.alert('Success', 'Ad units cache refreshed');
            await loadAllData();
          } catch (error) {
            Alert.alert('Error', 'Failed to refresh ad units cache');
          } finally {
            setLoading(false);
          }
        }}>
          <Text style={styles.actionButtonText}>Refresh Ad Units Cache</Text>
        </TouchableOpacity>
      </View>

      {/* Ad Configurations */}
      <Text style={styles.sectionTitle}>Ad Configurations ({adConfigs.length})</Text>
      {adConfigs.map(renderAdConfig)}

      {/* Ad Units */}
      <Text style={styles.sectionTitle}>Ad Units ({adUnits.length})</Text>
      {adUnits.map(renderAdUnit)}

      {/* Edit Modal */}
      {renderEditConfigModal()}
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
    marginBottom: 20,
    color: '#333',
  },
  loading: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginVertical: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: '30%',
  },
  actionButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
    color: '#333',
  },
  configCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unitCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  unitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  configDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  editButton: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ratingButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 50,
  },
  selectedRating: {
    backgroundColor: '#007AFF',
  },
  ratingButtonText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConfigManager;