import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Linking, Modal } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { Mail, Lock, LogIn, LogOut, User, UserPlus, KeyRound, Edit3, MessageSquare, Star, Eye, Film, Clock, ArrowRight } from 'lucide-react-native';

type AuthMode = 'login' | 'signup' | 'reset';

export default function MyPageScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // [제1조 2항 준수] 인증 모드 상태 관리
  // 하나의 화면(mypage.tsx)에서 로그인, 회원가입, 비밀번호 찾기 모드를 전환하기 위한 상태입니다.
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // --- Phase 4: 마이페이지 활동 내역 상태 ---
  const [nickname, setNickname] = useState('');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  
  const [activeTab, setActiveTab] = useState<'posts' | 'reviews'>('posts');
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        const currentNickname = user.user_metadata?.nickname || user.user_metadata?.name || user.email?.split('@')[0] || "User";
        setNickname(currentNickname);
        setEditNickname(currentNickname);
        
        const fetchData = async () => {
          setDataLoading(true);
          try {
            // 내 게시글 조회
            const { data: posts } = await supabase
              .from('talk_posts')
              .select('*')
              .eq('author', currentNickname)
              .order('created_at', { ascending: false });
            if (posts) setMyPosts(posts);

            // 내 리뷰 조회 (reviews 테이블은 user_id가 아닌 author를 사용)
            const { data: reviews } = await supabase
              .from('reviews')
              .select('*')
              .eq('author', currentNickname)
              .order('created_at', { ascending: false });
            if (reviews) setMyReviews(reviews);
          } catch (err) {
            console.error(err);
          } finally {
            setDataLoading(false);
          }
        };

        fetchData();
      }
    }, [user])
  );

  const handleUpdateNickname = async () => {
    if (!editNickname.trim()) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { nickname: editNickname.trim() }
      });
      if (error) throw error;
      
      // 이전 닉네임으로 작성된 글/댓글/한줄평의 작성자 명도 함께 업데이트
      if (nickname) {
        await supabase
          .from('talk_posts')
          .update({ author: editNickname.trim() })
          .eq('author', nickname);
          
        await supabase
          .from('talk_comments')
          .update({ author: editNickname.trim() })
          .eq('author', nickname);
          
        await supabase
          .from('reviews')
          .update({ author: editNickname.trim() })
          .eq('author', nickname);
      }

      setNickname(editNickname.trim());
      setIsEditModalVisible(false);
      Alert.alert('완료', '닉네임이 성공적으로 변경되었습니다.');
      
      // 상태 새로고침을 위해 임시로 데이터를 비우고 다시 로드하게 함
      setMyPosts(prev => prev.map(p => ({ ...p, author: editNickname.trim() })));
      setMyReviews(prev => prev.map(r => ({ ...r, author: editNickname.trim() })));
    } catch (error: any) {
      Alert.alert('변경 실패', error.message);
    }
  };

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
            
            <TouchableOpacity onPress={() => Linking.openURL('https://movielobby.vercel.app/privacy')} style={{ marginTop: 24, padding: 8 }}>
              <Text style={{ color: Colors.textMuted, fontSize: 13, textDecorationLine: 'underline' }}>개인정보처리방침</Text>
            </TouchableOpacity>
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
          <Text style={styles.avatarText}>{nickname.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.userNickname}>{nickname}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <TouchableOpacity style={styles.editNicknameBtn} onPress={() => setIsEditModalVisible(true)}>
          <Edit3 size={14} color={Colors.textMuted} style={{ marginRight: 4 }} />
          <Text style={{ color: Colors.textMuted, fontSize: 13 }}>닉네임 변경</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'posts' && styles.tabButtonActive]}
          onPress={() => setActiveTab('posts')}
        >
          <MessageSquare size={18} color={activeTab === 'posts' ? Colors.accentBlue : Colors.textMuted} style={{ marginRight: 8 }} />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>내 게시글 ({myPosts.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'reviews' && styles.tabButtonActive]}
          onPress={() => setActiveTab('reviews')}
        >
          <Star size={18} color={activeTab === 'reviews' ? Colors.accentRed : Colors.textMuted} style={{ marginRight: 8 }} />
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>내 한줄평 ({myReviews.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {dataLoading ? (
          <ActivityIndicator size="large" color={Colors.accentBlue} style={{ marginTop: 40 }} />
        ) : activeTab === 'posts' ? (
          // 내 게시글 리스트
          myPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>아직 작성한 게시글이 없습니다.</Text>
            </View>
          ) : (
            myPosts.map((post) => (
              <TouchableOpacity 
                key={post.id} 
                style={styles.historyCard}
                onPress={() => router.push(`/talk-detail/${post.movie_id}/${post.id}` as any)}
                activeOpacity={0.7}
              >
                <View style={styles.historyHeader}>
                  {post.is_spoiler && (
                    <View style={styles.spoilerBadge}>
                      <Text style={styles.spoilerText}>스포일러</Text>
                    </View>
                  )}
                  <Text style={styles.historyTitle} numberOfLines={1}>{post.title}</Text>
                  <ArrowRight size={16} color={Colors.textMuted} />
                </View>
                <View style={styles.historyFooter}>
                  <View style={styles.historyFooterItem}><Film size={12} color={Colors.textMuted} /><Text style={styles.historyFooterText} numberOfLines={1}>{post.movie_title}</Text></View>
                  <View style={styles.historyFooterItem}><Clock size={12} color={Colors.textMuted} /><Text style={styles.historyFooterText}>{new Date(post.created_at).toLocaleDateString()}</Text></View>
                  <View style={styles.historyFooterItem}><Eye size={12} color={Colors.textMuted} /><Text style={styles.historyFooterText}>{post.views || 0}</Text></View>
                </View>
              </TouchableOpacity>
            ))
          )
        ) : (
          // 내 한줄평 리스트
          myReviews.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>아직 작성한 한줄평이 없습니다.</Text>
            </View>
          ) : (
            myReviews.map((review) => (
              <TouchableOpacity 
                key={review.id} 
                style={styles.historyCard}
                onPress={() => router.push(`/movie/${review.movie_id}` as any)}
                activeOpacity={0.7}
              >
                <View style={styles.historyHeader}>
                  <Star size={16} color="#f5c518" style={{ marginRight: 6 }} />
                  <Text style={styles.historyTitle} numberOfLines={1}>{review.rating}점</Text>
                  <ArrowRight size={16} color={Colors.textMuted} />
                </View>
                <Text style={styles.historyContent} numberOfLines={2}>{review.text}</Text>
                <View style={styles.historyFooter}>
                  <View style={styles.historyFooterItem}><Film size={12} color={Colors.textMuted} /><Text style={styles.historyFooterText} numberOfLines={1}>영화 ID: {review.movie_id}</Text></View>
                  <View style={styles.historyFooterItem}><Clock size={12} color={Colors.textMuted} /><Text style={styles.historyFooterText}>{new Date(review.created_at).toLocaleDateString()}</Text></View>
                </View>
              </TouchableOpacity>
            ))
          )
        )}
      </View>

      <View style={[styles.section, { marginTop: 16 }]}>
        <Text style={styles.sectionTitle}>정보</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('https://movielobby.vercel.app/privacy')}>
          <Text style={styles.menuText}>개인정보처리방침</Text>
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

      {/* Nickname Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>닉네임 변경</Text>
            <TextInput
              style={styles.modalInput}
              value={editNickname}
              onChangeText={setEditNickname}
              placeholder="새로운 닉네임을 입력하세요"
              placeholderTextColor={Colors.textMuted}
              maxLength={20}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => {
                  setIsEditModalVisible(false);
                  setEditNickname(nickname);
                }}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleUpdateNickname}>
                <Text style={styles.modalSaveText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: Colors.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userNickname: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: Colors.textMuted,
    fontSize: 14,
    marginBottom: 12,
  },
  editNicknameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkCardBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: Colors.darkCardBg,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: Colors.darkCardBg,
    borderRadius: 12,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: Colors.darkCardBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  historyContent: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  historyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  historyFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyFooterText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  spoilerBadge: {
    backgroundColor: 'rgba(255,0,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  spoilerText: {
    color: Colors.accentRed,
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.darkCardBg,
    width: '100%',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: Colors.darkBackground,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
    borderRadius: 8,
    color: '#fff',
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalSaveBtn: {
    backgroundColor: Colors.accentBlue,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
