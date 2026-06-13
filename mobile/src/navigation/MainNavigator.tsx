import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/home/HomeScreen';
import { BetScreen } from '../screens/bet/BetScreen';
import { LiveScreen } from '../screens/live/LiveScreen';
import { WalletScreen } from '../screens/wallet/WalletScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ChangePasswordScreen } from '../screens/profile/ChangePasswordScreen';
import { DepositScreen } from '../screens/wallet/DepositScreen';
import { LiveDetailScreen } from '../screens/live/LiveDetailScreen';
import { colors } from '../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

export type MainTabParamList = {
  Home: undefined;
  Bet: undefined;
  LiveTab: undefined;
  WalletTab: undefined;
  ProfileTab: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  ChangePassword: undefined;
};

export type LiveStackParamList = {
  LiveList: undefined;
  LiveDetail: { raceId: string };
};

export type WalletStackParamList = {
  WalletHome: undefined;
  Deposit: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const LiveStack = createNativeStackNavigator<LiveStackParamList>();
const WalletStack = createNativeStackNavigator<WalletStackParamList>();

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </ProfileStack.Navigator>
  );
}

function LiveStackNavigator() {
  return (
    <LiveStack.Navigator screenOptions={{ headerShown: false }}>
      <LiveStack.Screen name="LiveList" component={LiveScreen} />
      <LiveStack.Screen name="LiveDetail" component={LiveDetailScreen} />
    </LiveStack.Navigator>
  );
}

function WalletStackNavigator() {
  return (
    <WalletStack.Navigator screenOptions={{ headerShown: false }}>
      <WalletStack.Screen name="WalletHome" component={WalletScreen} />
      <WalletStack.Screen name="Deposit" component={DepositScreen} />
    </WalletStack.Navigator>
  );
}

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home: ['home', 'home-outline'],
            Bet: ['trophy', 'trophy-outline'],
            LiveTab: ['radio', 'radio-outline'],
            WalletTab: ['wallet', 'wallet-outline'],
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
        name="LiveTab"
        component={LiveStackNavigator}
        options={{
          title: 'Live 🔴',
          tabBarActiveTintColor: colors.danger,
        }}
      />
      <Tab.Screen name="WalletTab" component={WalletStackNavigator} options={{ title: 'Ví' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ title: 'Cá Nhân' }} />
    </Tab.Navigator>
  );
}
