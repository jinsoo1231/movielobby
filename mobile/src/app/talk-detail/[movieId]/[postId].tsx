import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Keyboard
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Clock, Eye, ThumbsUp, ThumbsDown, MessageSquare, Send } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';

export default function TalkPostDetailScreen() {
  const { movieId, postId } = useLocalSearchParams<{ movieId: string; postId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [showSpoiler, setShowSpoiler] = useState(false);

  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 데이터 로드
  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        setLoading(true);

        // 1. 게시글 상세 조회
        const { data: postData, error: postError } = await supabase
          .from('talk_posts')
          .select('*')
          .eq('id', postId)
          .single();

        if (postError || !postData) {
          Alert.alert('오류', '게시글을 불러올 수 없습니다.');
          router.back();
          return;
        }

        // 조회수 +1 처리 (처음 로드 시)
        const newViews = (postData.views || 0) + 1;
        await supabase.from('talk_posts').update({ views: newViews }).eq('id', postId);
        setPost({ ...postData, views: newViews });

        // 2. 댓글 목록 조회
        const { data: commentsData } = await supabase
          .from('talk_comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });

        if (commentsData) {
          setComments(commentsData);
        }

        // 3. 현재 유저의 투표 상태 조회
        let activeUser = user;
        if (!activeUser) {
          const { data: { user: directUser } } = await supabase.auth.getUser();
          activeUser = directUser;
        }

        if (activeUser) {
          const { data: voteData } = await supabase
            .from('vote_logs')
            .select('vote_type')
            .eq('user_id', activeUser.id)
            .eq('target_type', 'post')
            .eq('target_id', postId)
            .maybeSingle();

          if (voteData) {
            setUserVote(voteData.vote_type as 'like' | 'dislike');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPostAndComments();
    }
  }, [postId, user]);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleVote = async (type: 'like' | 'dislike') => {
    let activeUser = user;
    if (!activeUser) {
      const { data: { user: directUser } } = await supabase.auth.getUser();
      activeUser = directUser;
    }

    if (!activeUser) {
      Alert.alert(
        '로그인 필요',
        '추천/비추천은 로그인 후 이용할 수 있습니다.\n마이페이지로 이동하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '로그인하기', onPress: () => router.push('/(tabs)/mypage' as any) }
        ]
      );
      return;
    }

    if (userVote) {
      Alert.alert('알림', '이미 참여하신 게시글입니다. (1인 1회만 참여 가능)');
      return;
    }

    if (isVoting) return;
    setIsVoting(true);

    try {
      // 투표 이력 저장
      const { error: logError } = await supabase
        .from('vote_logs')
        .insert([{
          user_id: activeUser.id,
          target_type: 'post',
          target_id: postId,
          vote_type: type
        }]);

      if (logError) {
        if (logError.code === '23505') {
          Alert.alert('알림', '이미 참여하신 게시글입니다.');
        } else {
          Alert.alert('오류', '투표 처리에 실패했습니다.');
        }
        return;
      }

      setUserVote(type);

      if (type === 'like') {
        const newLikes = (post.likes || 0) + 1;
        await supabase.from('talk_posts').update({ likes: newLikes }).eq('id', postId);
        setPost({ ...post, likes: newLikes });
      } else {
        const newDislikes = (post.dislikes || 0) + 1;
        await supabase.from('talk_posts').update({ dislikes: newDislikes }).eq('id', postId);
        setPost({ ...post, dislikes: newDislikes });
      }
    } catch (err) {
      console.error(err);
      Alert.alert('오류', '시스템 에러가 발생했습니다.');
    } finally {
      setIsVoting(false);
    }
  };

  const handleCommentSubmit = async () => {
    let activeUser = user;
    if (!activeUser) {
      const { data: { user: directUser } } = await supabase.auth.getUser();
      activeUser = directUser;
    }

    if (!activeUser) {
      Alert.alert(
        '로그인 필요',
        '댓글을 작성하려면 로그인이 필요합니다.\n마이페이지로 이동하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '로그인하기', onPress: () => router.push('/(tabs)/mypage' as any) }
        ]
      );
      return;
    }

    if (!commentContent.trim()) {
      Alert.alert('알림', '댓글 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
      const currentNickname = activeUser.user_metadata?.nickname || activeUser.user_metadata?.name || activeUser.email?.split('@')[0] || '익명';

      const { data, error } = await supabase
        .from('talk_comments')
        .insert([{ post_id: postId, author: currentNickname, content: commentContent.trim() }])
        .select();

      if (error) {
        console.error('Comment Insert Error:', error);
        Alert.alert('오류', `댓글 등록에 실패했습니다.\n${error.message}`);
      } else if (data && data[0]) {
        setComments([...comments, data[0]]);
        setCommentContent('');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('오류', '시스템 에러가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !post) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accentBlue} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{post.movie_title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Post Content */}
          <View style={styles.postCard}>
            <View style={styles.titleRow}>
              {post.is_spoiler && (
                <View style={styles.spoilerBadge}>
                  <Text style={styles.spoilerText}>스포일러</Text>
                </View>
              )}
              <Text style={styles.postTitle}>{post.title}</Text>
            </View>

            <View style={styles.postMeta}>
              <View style={styles.metaLeft}>
                <User size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>{post.author}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Clock size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>{formatDate(post.created_at)}</Text>
              </View>
              <View style={styles.metaRight}>
                <Eye size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>조회 {post.views}</Text>
              </View>
            </View>

            {/* 스포일러 블러 렌더링 */}
            <View style={styles.contentWrapper}>
              {post.is_spoiler && !showSpoiler ? (
                <View style={styles.spoilerContainer}>
                  <Text style={[styles.postContent, { opacity: 0.3 }]} numberOfLines={6}>
                    {post.content}
                  </Text>
                  {Platform.OS === 'ios' ? (
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                  ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
                  )}
                  <View style={styles.spoilerOverlay}>
                    <TouchableOpacity 
                      style={styles.spoilerUnlockBtn} 
                      onPress={() => setShowSpoiler(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.spoilerUnlockText}>🚨 스포일러 포함된 글입니다 (터치해서 보기)</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={styles.postContent}>{post.content}</Text>
              )}
            </View>

            {/* Voting Buttons */}
            <View style={styles.voteContainer}>
              <TouchableOpacity 
                style={[styles.voteBtn, userVote === 'like' && styles.voteBtnLiked]} 
                onPress={() => handleVote('like')}
                activeOpacity={0.7}
              >
                <ThumbsUp size={24} color={userVote === 'like' ? Colors.accentBlue : Colors.textMuted} />
                <Text style={[styles.voteText, userVote === 'like' && { color: Colors.accentBlue, fontWeight: 'bold' }]}>
                  {post.likes || 0}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.voteBtn, userVote === 'dislike' && styles.voteBtnDisliked]} 
                onPress={() => handleVote('dislike')}
                activeOpacity={0.7}
              >
                <ThumbsDown size={24} color={userVote === 'dislike' ? Colors.accentRed : Colors.textMuted} />
                <Text style={[styles.voteText, userVote === 'dislike' && { color: Colors.accentRed, fontWeight: 'bold' }]}>
                  {post.dislikes || 0}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <View style={styles.commentsHeader}>
              <MessageSquare size={20} color={Colors.accentBlue} />
              <Text style={styles.commentsTitle}>댓글 {comments.length}개</Text>
            </View>

            <View style={styles.commentsList}>
              {comments.length === 0 ? (
                <Text style={styles.noCommentsText}>첫 번째 댓글을 남겨주세요!</Text>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>{comment.author.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.commentBody}>
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentAuthor}>{comment.author}</Text>
                        <Text style={styles.commentDate}>{formatDate(comment.created_at)}</Text>
                      </View>
                      <Text style={styles.commentText}>{comment.content}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Comment Input Sticky Footer */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder={user ? "자유롭게 댓글을 남겨보세요!" : "로그인 후 댓글을 작성할 수 있습니다."}
            placeholderTextColor={Colors.textMuted}
            value={commentContent}
            onChangeText={setCommentContent}
            multiline
            maxLength={300}
            editable={!isSubmitting}
          />
          <TouchableOpacity 
            style={[styles.commentSubmitBtn, (!commentContent.trim() || isSubmitting) && { opacity: 0.5 }]} 
            onPress={handleCommentSubmit}
            disabled={!commentContent.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkCardBorder,
    backgroundColor: Colors.darkBackground,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  postCard: {
    backgroundColor: Colors.darkCardBg,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  spoilerBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.light.danger,
    marginBottom: 4,
  },
  spoilerText: {
    color: Colors.light.danger,
    fontSize: 12,
    fontWeight: 'bold',
  },
  postTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    lineHeight: 28,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: Colors.textMuted,
    fontSize: 13,
    marginLeft: 6,
  },
  metaDot: {
    color: Colors.textMuted,
    marginHorizontal: 8,
  },
  contentWrapper: {
    minHeight: 150,
  },
  postContent: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 26,
  },
  spoilerContainer: {
    position: 'relative',
    minHeight: 150,
    borderRadius: 8,
    overflow: 'hidden',
  },
  spoilerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spoilerUnlockBtn: {
    backgroundColor: Colors.accentRed,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  spoilerUnlockText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  voteContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: 32,
  },
  voteBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.darkCardBorder,
    backgroundColor: 'transparent',
  },
  voteBtnLiked: {
    borderColor: Colors.accentBlue,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
  },
  voteBtnDisliked: {
    borderColor: Colors.accentRed,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  voteText: {
    marginTop: 4,
    color: Colors.textMuted,
    fontSize: 14,
  },
  commentsSection: {
    backgroundColor: Colors.darkCardBg,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  commentsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  commentsList: {
    flexDirection: 'column',
  },
  noCommentsText: {
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  commentBody: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },
  commentDate: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  commentText: {
    color: '#ddd',
    fontSize: 15,
    lineHeight: 22,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: Colors.darkCardBg,
    borderTopWidth: 1,
    borderTopColor: Colors.darkCardBorder,
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    color: '#fff',
    fontSize: 15,
    maxHeight: 120,
    minHeight: 44,
  },
  commentSubmitBtn: {
    backgroundColor: Colors.accentBlue,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginBottom: 0,
  },
});
