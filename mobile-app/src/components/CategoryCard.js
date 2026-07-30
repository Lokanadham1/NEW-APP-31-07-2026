import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';

export default function CategoryCard({ category, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <Text style={styles.emoji}>{category.emoji}</Text>
      <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
        {category.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    minWidth: 84,
  },
  cardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
  },
  nameSelected: {
    color: '#fff',
  },
});
