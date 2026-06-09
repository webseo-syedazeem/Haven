import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + 90 }]}>
      <Text style={styles.title}>Progress</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: '#F7F2FF',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#173F5F',
    fontSize: 24,
    fontWeight: '700',
  },
});
