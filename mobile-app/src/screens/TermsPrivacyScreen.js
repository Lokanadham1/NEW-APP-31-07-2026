import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/colors';
import Header from '../components/Header';
import { useAdminPhone } from '../context/AdminPhoneContext';

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

export default function TermsPrivacyScreen({ navigation }) {
  const { adminPhone } = useAdminPhone();

  return (
    <View style={styles.screen}>
      <Header title="Terms & Privacy Policy" onBack={() => navigation.goBack()} showAlerts={false} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Section title="What we collect">
          Your mobile number (for sign-in), name, catering/business name, and delivery address,
          plus the orders you place through the app (items, quantities, delivery date/time,
          payments, and any notes you add). If you allow notifications, we also store a device
          token so we can send order updates.
        </Section>
        <Section title="How it's used">
          Solely to run your account and fulfil your orders — sign-in, order processing,
          delivery, billing, and order-status notifications. We don't sell your information
          or share it with third parties for marketing.
        </Section>
        <Section title="Orders & billing">
          Order totals are calculated from current menu prices. Payments you make are recorded
          against your account so you and Roti & More can both see your balance.
        </Section>
        <Section title="Your choices">
          You can update your profile and delivery address any time from the Profile tab.
          To have your account or data removed, contact us using the number below.
        </Section>
        <Section title="Contact">
          {adminPhone
            ? `Questions about this policy or your data? Call us at ${adminPhone}.`
            : "Questions about this policy or your data? Use the Help & Support option on the Profile tab."}
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: spacing.xs },
  body: { fontSize: 13.5, color: colors.slate, lineHeight: 20 },
});
