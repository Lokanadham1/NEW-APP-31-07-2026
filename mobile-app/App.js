import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { AuthProvider } from './src/context/AuthContext';
import { ProductsProvider } from './src/context/ProductsContext';
import { CartProvider } from './src/context/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import { navigateToNotifications } from './src/navigation/navigationRef';

export default function App() {
  // Tapping a push notification (app backgrounded or killed) opens the
  // Notifications screen. Foreground notifications are shown via the handler
  // set up in src/push/notifications.js.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      navigateToNotifications();
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProductsProvider>
          <CartProvider>
            <StatusBar style="dark" />
            <AppNavigator />
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
