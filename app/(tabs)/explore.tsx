import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function MoodScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.center}>
        <Text style={styles.title}>Mood</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    backgroundColor: '#F7F2FF',
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 110,
    paddingHorizontal: 18,
    paddingTop: 54,
  },
  screen: {
    backgroundColor: '#F7F2FF',
    flex: 1,
  },
  title: {
    color: '#173F5F',
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 30,
  },
});
