import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

type LegalDisclaimerProps = {
  prefix?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  linkStyle?: TextStyle;
};

export function LegalDisclaimer({
  prefix = 'By continuing, you agree to our',
  style,
  textStyle,
  linkStyle,
}: LegalDisclaimerProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={textStyle}>{prefix} </Text>
      <Link href="/profile/terms" asChild>
        <Pressable accessibilityRole="link" hitSlop={8}>
          <Text style={[textStyle, linkStyle]}>Terms of Service</Text>
        </Pressable>
      </Link>
      <Text style={textStyle}> and </Text>
      <Link href="/profile/privacy-policy" asChild>
        <Pressable accessibilityRole="link" hitSlop={8}>
          <Text style={[textStyle, linkStyle]}>Privacy Policy</Text>
        </Pressable>
      </Link>
      <Text style={textStyle}>.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
