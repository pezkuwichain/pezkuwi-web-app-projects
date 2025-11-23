import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { KurdistanColors } from '../theme/colors';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import WalletScreen from '../screens/WalletScreen';
import SwapScreen from '../screens/SwapScreen';
import P2PScreen from '../screens/P2PScreen';
import EducationScreen from '../screens/EducationScreen';
import ForumScreen from '../screens/ForumScreen';
import BeCitizenScreen from '../screens/BeCitizenScreen';
import ReferralScreen from '../screens/ReferralScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type BottomTabParamList = {
  Home: undefined;
  Wallet: undefined;
  Swap: undefined;
  P2P: undefined;
  Education: undefined;
  Forum: undefined;
  BeCitizen: undefined;
  Referral: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Custom Tab Bar Button for Center Button
const CustomTabBarButton: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
}> = ({ children, onPress }) => (
  <TouchableOpacity
    style={styles.customButtonContainer}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.customButton}>{children}</View>
  </TouchableOpacity>
);

const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: KurdistanColors.kesk,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={[styles.icon, { color }]}>
              {focused ? '🏠' : '🏚️'}
            </Text>
          ),
        }}
      />

      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={[styles.icon, { color }]}>
              {focused ? '💰' : '👛'}
            </Text>
          ),
        }}
      />

      <Tab.Screen
        name="Swap"
        component={SwapScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={[styles.icon, { color }]}>
              {focused ? '🔄' : '↔️'}
            </Text>
          ),
        }}
      />

      <Tab.Screen
        name="P2P"
        component={P2PScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={[styles.icon, { color }]}>
              {focused ? '💱' : '💰'}
            </Text>
          ),
        }}
      />

      <Tab.Screen
        name="Education"
        component={EducationScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={[styles.icon, { color }]}>
              {focused ? '🎓' : '📚'}
            </Text>
          ),
        }}
      />

      <Tab.Screen
        name="Forum"
        component={ForumScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={[styles.icon, { color }]}>
              {focused ? '💬' : '📝'}
            </Text>
          ),
        }}
      />

      <Tab.Screen
        name="BeCitizen"
        component={BeCitizenScreen}
        options={{
          tabBarLabel: 'Be Citizen',
          tabBarIcon: ({ focused: _focused }) => (
            <Text style={[styles.centerIcon]}>
              🏛️
            </Text>
          ),
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />

      <Tab.Screen
        name="Referral"
        component={ReferralScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={[styles.icon, { color }]}>
              {focused ? '🤝' : '👥'}
            </Text>
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={[styles.icon, { color }]}>
              {focused ? '👤' : '👨'}
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: KurdistanColors.spi,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  icon: {
    fontSize: 24,
  },
  customButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: KurdistanColors.kesk,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: KurdistanColors.kesk,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: KurdistanColors.spi,
  },
  centerIcon: {
    fontSize: 32,
  },
});

export default BottomTabNavigator;
