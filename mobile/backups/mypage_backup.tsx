import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

export default function MyPageScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MyPage Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  }
});
