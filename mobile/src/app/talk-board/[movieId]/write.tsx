import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, AlertTriangle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { fetchMovieDetails } from '@/lib/tmdb';
import { Colors } from '@/constants/theme';

export default function TalkWriteScreen() {
  const { movieId } = useLocalSearchParams<{ movieId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [movieTitle, setMovieTitle] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      let activeUser = user;
      if (!activeUser) {
        const { data: { user: directUser } } = await supabase.auth.getUser();
        activeUser = directUser;
      }
      
      if (!activeUser) {
        Alert.alert(
          '로그인 필요',
          '게시글을 작성하려면 로그인이 필요합니다.',
          [
            { text: '확인', onPress: () => router.back() }
          ]
        );
        return;
      }

      if (movieId) {
        const movieData = await fetchMovieDetails(parseInt(movieId, 10));
        if (movieData) setMovieTitle(movieData.title);
      }
    };
    checkAuthAndLoad();
  }, [movieId, user]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('알림', '제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('알림', '내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      let activeUser = user;
      if (!activeUser) {
        const { data: { user: directUser } } = await supabase.auth.getUser();
        activeUser = directUser;
      }

      const currentNickname = activeUser?.user_metadata?.nickname || activeUser?.user_metadata?.name || activeUser?.email?.split('@')[0] || '익명';

      const { error } = await supabase
        .from('talk_posts')
        .insert([{
          movie_id: movieId,
          movie_title: movieTitle || '영화',
          title: title.trim(),
          content: content.trim(),
          author: currentNickname,
          is_spoiler: isSpoiler
        }]);

      if (error) {
        console.error(error);
        Alert.alert('오류', '게시글 등록에 실패했습니다.');
      } else {
        router.back();
      }
    } catch (err) {
      console.error(err);
      Alert.alert('오류', '시스템 에러가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>글쓰기</Text>
        <TouchableOpacity 
          style={[styles.submitButton, (!title.trim() || !content.trim() || isSubmitting) && { opacity: 0.5 }]} 
          onPress={handleSubmit}
          disabled={!title.trim() || !content.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>등록</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content}>
          <Text style={styles.movieTitleText}>{movieTitle ? `[${movieTitle}]` : ''} 커뮤니티에 글쓰기</Text>
          
          <TextInput
            style={styles.titleInput}
            placeholder="제목을 입력하세요 (최대 50자)"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />
          
          <View style={styles.contentInputContainer}>
            <TextInput
              style={styles.contentInput}
              placeholder="자유롭게 영화에 대한 이야기를 남겨보세요. (최대 2000자)"
              placeholderTextColor={Colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.charCount}>{content.length}/2000</Text>
          </View>

          <TouchableOpacity style={styles.spoilerToggle} onPress={() => setIsSpoiler(!isSpoiler)} activeOpacity={0.8}>
            <View style={[styles.checkbox, isSpoiler && styles.checkboxActive]}>
              {isSpoiler && <Check size={16} color="#fff" />}
            </View>
            <AlertTriangle size={20} color={isSpoiler ? Colors.light.danger : Colors.textMuted} />
            <Text style={[styles.spoilerToggleText, isSpoiler && { color: Colors.light.danger, fontWeight: 'bold' }]}>
              스포일러가 포함된 글입니다
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.spoilerNotice}>
            * 결말이나 중요한 반전이 포함된 경우 반드시 체크해주세요. 다른 사용자를 위해 블러 처리됩니다.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: Colors.accentBlue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  movieTitleText: {
    color: Colors.accentBlue,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  titleInput: {
    backgroundColor: Colors.darkCardBg,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  contentInputContainer: {
    backgroundColor: Colors.darkCardBg,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
    borderRadius: 8,
    marginBottom: 20,
    height: 300,
  },
  contentInput: {
    flex: 1,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  charCount: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    color: Colors.textMuted,
    fontSize: 12,
  },
  spoilerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.light.danger,
    borderColor: Colors.light.danger,
  },
  spoilerToggleText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  spoilerNotice: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
});
