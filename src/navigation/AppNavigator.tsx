// src/navigation/AppNavigator.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { LevelMapScreen } from '../screens/LevelMapScreen';
import { GameScreen } from '../screens/GameScreen';
import { Level } from '../types/index';

export type RootStackParamList = {
  Home: undefined;
  LevelMap: undefined;
  Game: { level: Level };
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: 'transparent' },
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress,
            },
          }),
        }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="LevelMap" component={LevelMapScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};