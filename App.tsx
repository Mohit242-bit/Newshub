/**
 * NewsHub - Multi-source News Aggregator
 * 
 * @format
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator();

class ErrorBoundary extends React.Component<any, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('❌ App Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{this.state.error?.message || 'Unknown error'}</Text>
          <Text style={styles.errorHint}>Please restart the app</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function App(): React.JSX.Element {
  useEffect(() => {
    // Set up global error handler for unhandled promise rejections
    const unsubscribe = require('react-native').AppState.addEventListener?.(
      'change',
      (state: any) => {
        if (state === 'active') {
          console.log('✅ App became active');
        }
      }
    );

    // Catch unhandled promise rejections
    const handleUnhandledRejection = (event: any) => {
      console.error('❌ Unhandled Promise Rejection:', event.reason);
      // Prevent app crash by suppressing the rejection
      event.preventDefault?.();
    };

    // Note: React Native doesn't directly support unhandledrejection event
    // but we can wrap async operations with try-catch

    return () => {
      if (unsubscribe) {
        unsubscribe.remove?.();
      }
    };
  }, []);

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e63946',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorHint: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default App;
