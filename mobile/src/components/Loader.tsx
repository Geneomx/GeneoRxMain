import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '@/theme';

export const Loader: React.FC<{ inline?: boolean }> = ({ inline }) => (
  <View style={inline ? styles.inline : styles.full}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

const styles = StyleSheet.create({
  full: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  inline: { paddingVertical: 24, alignItems: 'center', justifyContent: 'center' },
});
