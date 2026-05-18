import { StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Profile</Text>
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
