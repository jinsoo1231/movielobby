import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { Mail, Lock, LogIn, LogOut, User } from 'lucide-react-native';

export default function MyPageScreen() {
  const { user, loading } = useAuth();
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert('로그인 실패', error.message);
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    await supabase.auth.signOut();
    setAuthLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.accentBlue} />
      </View>
    );
  }

  // --- 비로그인 화면 (Login Screen) ---
  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>MovieLobby 로그인</Text>
          <Text style={styles.authSubtitle}>이메일 계정으로 로그인해주세요.</Text>

          <View style={styles.inputContainer}>
            <Mail color={Colors.textMuted} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="이메일 주소"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock color={Colors.textMuted} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
            disabled={authLoading}
            activeOpacity={0.8}
          >
            {authLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <LogIn color="#fff" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.loginButtonText}>로그인</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- 로그인 완료 화면 (My Page) ---
  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <User size={40} color="#fff" />
        </View>
        <Text style={styles.userEmail}>{user.email}</Text>
        <Text style={styles.userJoined}>
          가입일: {new Date(user.created_at).toLocaleDateString('ko-KR')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>내 활동</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('알림', '준비 중입니다.')}>
          <Text style={styles.menuText}>내가 쓴 커뮤니티 글</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('알림', '준비 중입니다.')}>
          <Text style={styles.menuText}>내가 남긴 한줄평</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { marginTop: 40 }]}>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          disabled={authLoading}
        >
          {authLoading ? (
            <ActivityIndicator color={Colors.accentRed} />
          ) : (
            <>
              <LogOut color={Colors.accentRed} size={20} style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>로그아웃</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
    justifyContent: 'center',
    padding: 24,
  },
  authCard: {
    backgroundColor: Colors.darkCardBg,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingVertical: 14,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: Colors.accentBlue,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkCardBorder,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.darkCardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.accentCyan,
    marginBottom: 16,
  },
  userEmail: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userJoined: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  menuItem: {
    backgroundColor: Colors.darkCardBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
  },
  menuText: {
    color: '#fff',
    fontSize: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  logoutText: {
    color: Colors.accentRed,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
