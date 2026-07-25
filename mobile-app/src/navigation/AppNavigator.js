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
import CustomerDashboardScreen from '../screens/CustomerDashboardScreen';

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
const AdminTab = createBottomTabNavigator();

// Tab-level route names are deliberately distinct from the first screen name
// inside the stack each tab wraps (e.g. "HomeTab" wrapping a stack whose
// first screen is "Home"). Reusing the same name at both levels is what
// triggers React Navigation's "Found screens with the same name nested
// inside one another" warning — and produced real bugs here (ambiguous
// back-navigation) before this was fixed, not just a console warning.
//
// Alerts is not a bottom tab — it lives in the header (next to the call
// button on Home, next to a bell icon elsewhere) since it's a lightweight
// inbox, not a primary section of the app. Both "Notifications" and
// "AdminNotifications" are registered at the root stack level (below) so
// they're reachable from any screen regardless of which tab/stack it's
// nested in.
const TAB_ICONS = {
  HomeTab: '🏠',
  OrdersTab: '📦',
  Cart: '🛒',
  DashboardTab: '📊',
  ProfileTab: '👤',
  AdminDashboardTab: '📊',
  AdminOrdersTab: '📦',
  AdminProductsTab: '🍽️',
  AdminCustomersTab: '👥',
};

function TabIcon({ label, focused, badge }) {
  return (
    <View style={styles.tabIconWrap}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
        {TAB_ICONS[label]}
      </Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

function CartTabIcon({ focused }) {
  // Cart has no other confirmation when you add an item from Home/Menu, so a
  // live badge here is the only feedback a tap actually did something.
  const { itemCount } = useCart();
  return <TabIcon label="Cart" focused={focused} badge={itemCount} />;
}

function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="Home" component={HomeScreen} />
      <HomeStackNav.Screen name="Menu" component={MenuScreen} />
      <HomeStackNav.Screen name="ItemDetail" component={ItemDetailScreen} />
      <HomeStackNav.Screen name="Checkout" component={CheckoutScreen} />
      <HomeStackNav.Screen name="OrderSuccess" component={OrderSuccessScreen} />
    </HomeStackNav.Navigator>
  );
}

function OrdersStack() {
  return (
    <OrdersStackNav.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStackNav.Screen name="OrdersList" component={OrdersScreen} />
      <OrdersStackNav.Screen name="OrderDetail" component={OrderDetailScreen} />
    </OrdersStackNav.Navigator>
  );
}

function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNav.Screen name="ProfileMain" component={ProfileScreen} />
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
        tabBarIcon: ({ focused }) =>
          route.name === 'Cart'
            ? <CartTabIcon focused={focused} />
            : <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStack}
        options={{ tabBarLabel: 'Orders' }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            // By default, switching TO this tab from elsewhere resumes
            // whatever was last on top of its stack — e.g. a specific
            // OrderDetail pushed via "Track my order". That leaves the tab
            // opening a random past order instead of the orders list, which
            // is confusing since nothing on the tab bar shows you're deep in
            // a stack. Always reset to the list (and clear any status filter
            // left over from a deep link, e.g. from the dashboard) on tab press.
            navigation.navigate('OrdersTab', { screen: 'OrdersList', params: { status: 'all' } });
          },
        })}
      />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="DashboardTab" component={CustomerDashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: 'Profile' }} />
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
      <AdminTab.Screen
        name="AdminOrdersTab"
        component={AdminOrdersStack}
        options={{ tabBarLabel: 'Orders' }}
        listeners={({ navigation }) => ({
          // Same fix as the customer OrdersTab: always land on the full,
          // unfiltered list on tab press, instead of resuming a specific
          // order detail or filter left over from elsewhere (e.g. the
          // dashboard's "Pending" card).
          tabPress: () => navigation.navigate('AdminOrdersTab', { screen: 'AdminOrders', params: { status: 'all' } }),
        })}
      />
      <AdminTab.Screen name="AdminProductsTab" component={AdminProductsStack} options={{ tabBarLabel: 'Products' }} />
      <AdminTab.Screen name="AdminCustomersTab" component={AdminCustomersStack} options={{ tabBarLabel: 'Customers' }} />
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
        <RootStack.Screen name="Notifications" component={NotificationsScreen} />
        <RootStack.Screen name="AdminNotifications" component={AdminNotificationsScreen} />
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
