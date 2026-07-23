// A navigation ref usable outside the component tree (e.g. from a push
// notification tap handler in App.js), per React Navigation's documented
// pattern for navigating without a `navigation` prop.
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigateToNotifications() {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('MainTabs', { screen: 'Profile', params: { screen: 'Notifications' } });
}
