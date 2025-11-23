import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { useLanguage } from '../contexts/LanguageContext';
import { KurdistanColors } from '../theme/colors';

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import BottomTabNavigator from './BottomTabNavigator';

export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  MainApp: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { hasSelectedLanguage } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    // TODO: Implement actual auth check
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleLanguageSelected = () => {
    // Navigate to sign in after language selection
  };

  const handleSignIn = () => {
    setIsAuthenticated(true);
  };

  const handleSignUp = () => {
    setIsAuthenticated(true);
  };

  const _handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={KurdistanColors.kesk} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        {!hasSelectedLanguage ? (
          // Show welcome screen if language not selected
          <Stack.Screen name="Welcome">
            {(props) => (
              <WelcomeScreen
                {...props}
                onLanguageSelected={handleLanguageSelected}
              />
            )}
          </Stack.Screen>
        ) : !isAuthenticated ? (
          // Show auth screens if not authenticated
          <>
            <Stack.Screen name="SignIn">
              {(props) => (
                <SignInScreen
                  {...props}
                  onSignIn={handleSignIn}
                  onNavigateToSignUp={() => props.navigation.navigate('SignUp')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="SignUp">
              {(props) => (
                <SignUpScreen
                  {...props}
                  onSignUp={handleSignUp}
                  onNavigateToSignIn={() => props.navigation.navigate('SignIn')}
                />
              )}
            </Stack.Screen>
          </>
        ) : (
          // Show main app (bottom tabs) if authenticated
          <Stack.Screen name="MainApp" component={BottomTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
