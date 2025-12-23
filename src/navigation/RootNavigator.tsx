import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BubbleScreen from '../screens/BubbleScreen';

export type RootStackParamList = {
  Bubble: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Bubble"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Bubble" component={BubbleScreen} />
    </Stack.Navigator>
  );
};

export default RootNavigator;
