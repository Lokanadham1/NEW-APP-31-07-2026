import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { colors } from '../theme/colors';
import { navigationRef } from './navigationRef';
import { useCart } from '../context/CartContext';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import HomeScreen from '../screens/HomeScreen';
import MenuScreen from '../screens/MenuScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminOrderDetailScreen from '../screens/admin/AdminOrderDetailScreen';
import AdminProductsScreen from '../screens/admin/AdminProductsScreen';
import AdminProductFormScreen from '../screens/admin/AdminProductFormScreen';
import AdminCustomersScreen from '../screens/admin/AdminCustomersScreen';
import AdminCustomerDetailScreen from '../screens/admin/AdminCustomerDetailScreen';
import AdminNotificationsScreen from '../screens/admin/AdminNotificationsScreen';

const RootStack = createNativeStackNavigator();
const HomeStackNav = createNativeStackNavigator();
const OrdersStackNav = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AdminOrdersStackNav = createNativeStackNavigator();
const AdminProductsStackNav = createNativeStackNavigator();
const AdminCustomersStackNav = createNativeStackNavigator();
const AdminNotificationsStackNav = createNativeStackNavigator();
const AdminTab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: '🏠',
  Orders: '📦',
  Cart: '🛒',
  Profile: '👤',
  AdminDashboardTab: '📊',
  AdminOrdersTab: '📦',
  AdminProductsTab: '🍽️',
  AdminCustomersTab: '👥',
  AdminNotificationsTab: '🔔',
};

function TabIcon({ label, focused }) {
  // Cart has no other confirmation when you add an item from Home/Menu, so a
  // live badge here is the only feedback a tap actually did something.
  const { itemCount } = useCart();
  const showBadge = label === 'Cart' && itemCount > 0;

  return (
    <View style={styles.tabIconWrap}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
        {TAB_ICONS[label]}
      </Text>
      {showBadge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
        </View>
      ) : null}
    </View>
  );
}

function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="Home" component={HomeScreen} />
      <HomeStackNav.Screen name="Menu" component={MenuScreen} />
      <HomeStackNav.Screen name="ItemDetail" component={ItemDetailScreen} />
      <HomeStackNav.Screen name="Cart" component={CartScreen} />
      <HomeStackNav.Screen name="Checkout" component={CheckoutScreen} />
      <HomeStackNav.Screen name="OrderSuccess" component={OrderSuccessScreen} />
    </HomeStackNav.Navigator>
  );
}

function OrdersStack() {
  return (
    <OrdersStackNav.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStackNav.Screen name="Orders" component={OrdersScreen} />
      <OrdersStackNav.Screen name="OrderDetail" component={OrderDetailScreen} />
    </OrdersStackNav.Navigator>
  );
}

function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNav.Screen name="Profile" component={ProfileScreen} />
      <ProfileStackNav.Screen name="Notifications" component={NotificationsScreen} />
    </ProfileStackNav.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.slate,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Orders" component={OrdersStack} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

// ─── Admin ──────────────────────────────────────────────────────────────────
function AdminOrdersStack() {
  return (
    <AdminOrdersStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AdminOrdersStackNav.Screen name="AdminOrders" component={AdminOrdersScreen} />
      <AdminOrdersStackNav.Screen name="AdminOrderDetail" component={AdminOrderDetailScreen} />
    </AdminOrdersStackNav.Navigator>
  );
}

function AdminProductsStack() {
  return (
    <AdminProductsStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AdminProductsStackNav.Screen name="AdminProducts" component={AdminProductsScreen} />
      <AdminProductsStackNav.Screen name="AdminProductForm" component={AdminProductFormScreen} />
    </AdminProductsStackNav.Navigator>
  );
}

function AdminCustomersStack() {
  return (
    <AdminCustomersStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AdminCustomersStackNav.Screen name="AdminCustomers" component={AdminCustomersScreen} />
      <AdminCustomersStackNav.Screen name="AdminCustomerDetail" component={AdminCustomerDetailScreen} />
    </AdminCustomersStackNav.Navigator>
  );
}

function AdminNotificationsStack() {
  return (
    <AdminNotificationsStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AdminNotificationsStackNav.Screen name="AdminNotifications" component={AdminNotificationsScreen} />
    </AdminNotificationsStackNav.Navigator>
  );
}

function AdminTabs() {
  return (
    <AdminTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.slate,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <AdminTab.Screen name="AdminDashboardTab" component={AdminDashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <AdminTab.Screen name="AdminOrdersTab" component={AdminOrdersStack} options={{ tabBarLabel: 'Orders' }} />
      <AdminTab.Screen name="AdminProductsTab" component={AdminProductsStack} options={{ tabBarLabel: 'Products' }} />
      <AdminTab.Screen name="AdminCustomersTab" component={AdminCustomersStack} options={{ tabBarLabel: 'Customers' }} />
      <AdminTab.Screen name="AdminNotificationsTab" component={AdminNotificationsStack} options={{ tabBarLabel: 'Alerts' }} />
    </AdminTab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen name="AdminTabs" component={AdminTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: 64,
    paddingTop: 6,
    paddingBottom: 10,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabIconFocused: {
    opacity: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
});
