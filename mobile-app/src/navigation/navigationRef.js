// A navigation ref usable outside the component tree (e.g. from a push
// notification tap handler in App.js), per React Navigation's documented
// pattern for navigating without a `navigation` prop.
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

// Routes to whichever notifications screen matches the root tab the user is
// currently on — a tap can arrive while either a customer or an admin is
// signed in, and they have separate tab structures.
export function navigateToNotifications() {
  if (!navigationRef.isReady()) return;
  const state = navigationRef.getRootState();
  const currentRouteName = state?.routes?.[state.index]?.name;

  if (currentRouteName === 'AdminTabs') {
    navigationRef.navigate('AdminTabs', { screen: 'AdminNotificationsTab', params: { screen: 'AdminNotifications' } });
  } else {
    navigationRef.navigate('MainTabs', { screen: 'AlertsTab' });
  }
}
