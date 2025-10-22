/**
 * NewsHub - Multi-source News Aggregator
 * 
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerShown: false, // We handle our own header in HomeScreen
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
