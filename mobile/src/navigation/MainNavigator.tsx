import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/home/HomeScreen';
import { BetScreen } from '../screens/bet/BetScreen';
import { LiveScreen } from '../screens/live/LiveScreen';
import { WalletScreen } from '../screens/wallet/WalletScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ChangePasswordScreen } from '../screens/profile/ChangePasswordScreen';
import { colors } from '../constants/theme';

// Icons as simple text — replaced with SVG-based icons below
import Ionicons from '@expo/vector-icons/Ionicons';

export type MainTabParamList = {
  Home: undefined;
  Bet: undefined;
  Live: undefined;
  Wallet: undefined;
  ProfileTab: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  ChangePassword: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </ProfileStack.Navigator>
  );
}

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111111',
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home: ['home', 'home-outline'],
            Bet: ['trophy', 'trophy-outline'],
            Live: ['radio', 'radio-outline'],
            Wallet: ['wallet', 'wallet-outline'],
            ProfileTab: ['person', 'person-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Giải Đấu' }} />
      <Tab.Screen name="Bet" component={BetScreen} options={{ title: 'Đặt Cược' }} />
      <Tab.Screen
        name="Live"
        component={LiveScreen}
        options={{
          title: 'Live 🔴',
          tabBarActiveTintColor: '#ef4444',
        }}
      />
      <Tab.Screen name="Wallet" component={WalletScreen} options={{ title: 'Ví' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ title: 'Cá Nhân' }} />
    </Tab.Navigator>
  );
}
