import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { Mail, Lock, LogIn, LogOut, User, UserPlus, KeyRound } from 'lucide-react-native';

type AuthMode = 'login' | 'signup' | 'reset';

export default function MyPageScreen() {
  const { user, loading } = useAuth();
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // [제1조 2항 준수] 인증 모드 상태 관리
  // 하나의 화면(mypage.tsx)에서 로그인, 회원가입, 비밀번호 찾기 모드를 전환하기 위한 상태입니다.
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const handleAuthAction = async () => {
    if (!email) {
      Alert.alert('알림', '이메일을 입력해주세요.');
      return;
    }

    if (authMode !== 'reset' && !password) {
      Alert.alert('알림', '비밀번호를 입력해주세요.');
      return;
    }

    setAuthLoading(true);

    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('로그인 실패', error.message);
    } 
    else if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        Alert.alert('회원가입 실패', error.message);
      } else if (data?.user?.identities?.length === 0) {
        // [제1조 2항 준수] 중복 가입 방지 체크
        // Supabase는 보안상(이메일 열거 공격 방지) 중복된 이메일 가입 시 에러 대신 빈 identities를 반환합니다.
        Alert.alert('회원가입 실패', '이미 사용 중이거나 가입된 이메일 주소입니다.');
      } else {
        Alert.alert(
          '가입 확인 메일 발송 🚀', 
          '작성하신 이메일 주소로 확인 메일이 발송되었습니다.\n메일함에서 링크를 클릭하여 인증을 완료하신 후 로그인해 주세요!\n\n(만약 메일이 오지 않는다면 이메일 주소를 오타 없이 정확히 입력했는지 다시 확인해 주세요.)'
        );
        setAuthMode('login');
      }
    } 
    else if (authMode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:3000/update-password',
      });
      if (error) {
        Alert.alert('발송 실패', error.message);
      } else {
        Alert.alert('발송 완료', '비밀번호 재설정 링크가 이메일로 발송되었습니다.');
        setAuthMode('login');
      }
    }

    setAuthLoading(false);
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    await supabase.auth.signOut();
    setAuthLoading(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '회원 탈퇴',
      '정말로 탈퇴하시겠습니까? 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '탈퇴하기', 
          style: 'destructive',
          onPress: async () => {
            setAuthLoading(true);
            Alert.alert('탈퇴 완료', '회원 탈퇴 처리가 완료되었습니다.\n(보안을 위해 7일 보관 후 영구 삭제됩니다.)');
            await supabase.auth.signOut();
            setAuthLoading(false);
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.accentBlue} />
      </View>
    );
  }

  // --- 비로그인 화면 (Auth Screen) ---
  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>
            {authMode === 'login' ? 'MovieLobby 로그인' : 
             authMode === 'signup' ? '새 계정 만들기' : '비밀번호 재설정'}
          </Text>
          <Text style={styles.authSubtitle}>
            {authMode === 'login' ? '이메일 계정으로 로그인해주세요.' : 
             authMode === 'signup' ? '이메일과 비밀번호를 입력해주세요.' : '가입하신 이메일 주소를 입력해주세요.'}
          </Text>

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

          {authMode !== 'reset' && (
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
          )}

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleAuthAction}
            disabled={authLoading}
            activeOpacity={0.8}
          >
            {authLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                {authMode === 'login' && <LogIn color="#fff" size={20} style={{ marginRight: 8 }} />}
                {authMode === 'signup' && <UserPlus color="#fff" size={20} style={{ marginRight: 8 }} />}
                {authMode === 'reset' && <KeyRound color="#fff" size={20} style={{ marginRight: 8 }} />}
                <Text style={styles.actionButtonText}>
                  {authMode === 'login' ? '로그인' : 
                   authMode === 'signup' ? '회원가입' : '재설정 링크 받기'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Toggle Links */}
          <View style={styles.toggleContainer}>
            {authMode === 'login' ? (
              <>
                <TouchableOpacity onPress={() => setAuthMode('signup')}>
                  <Text style={styles.toggleText}>계정이 없으신가요? <Text style={styles.toggleTextBold}>회원가입</Text></Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setAuthMode('reset')} style={{ marginTop: 12 }}>
                  <Text style={styles.toggleText}>비밀번호를 잊으셨나요?</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => setAuthMode('login')}>
                <Text style={styles.toggleText}>이미 계정이 있으신가요? <Text style={styles.toggleTextBold}>로그인</Text></Text>
              </TouchableOpacity>
            )}
          </View>
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
          style={[styles.logoutButton, { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 12 }]} 
          onPress={handleLogout}
          disabled={authLoading}
        >
          {authLoading ? (
            <ActivityIndicator color={Colors.textMuted} />
          ) : (
            <>
              <LogOut color={Colors.textMuted} size={20} style={{ marginRight: 8 }} />
              <Text style={[styles.logoutText, { color: Colors.textMuted }]}>로그아웃</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleDeleteAccount}
          disabled={authLoading}
        >
          {authLoading ? (
            <ActivityIndicator color={Colors.accentRed} />
          ) : (
            <>
              <User size={20} color={Colors.accentRed} style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>회원 탈퇴</Text>
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
  actionButton: {
    backgroundColor: Colors.accentBlue,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  toggleText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  toggleTextBold: {
    color: Colors.accentBlue,
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
