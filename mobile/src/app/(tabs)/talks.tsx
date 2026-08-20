import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { MessageSquare, Flame, Eye, ThumbsUp } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { fetchTrendingMovies } from '@/lib/tmdb';
import { supabase } from '@/lib/supabase';
import { Link } from 'expo-router';

export default function TalksScreen() {
  const [hotMovies, setHotMovies] = useState<any[]>([]);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // [제1조 2항 준수] 커뮤니티 데이터 동시 로딩 로직
  // 앱 화면이 처음 켜질 때, TMDB API(영화 포스터)와 Supabase DB(최신글)를 동시에 병렬로 가져옵니다.
  // Promise.all을 사용하면 두 개의 네트워크 요청이 끝날 때까지 기다린 후 한 번에 화면을 렌더링하여 깜빡임을 줄일 수 있습니다.
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [moviesRes, postsRes] = await Promise.all([
          fetchTrendingMovies(),
          supabase
            .from('talk_posts')
            .select('id, movie_id, movie_title, title, author, views, likes, created_at, is_spoiler')
            .order('created_at', { ascending: false })
            .limit(20)
        ]);
        
        if (moviesRes && moviesRes.results) {
          setHotMovies(moviesRes.results.slice(0, 10)); // 상위 10개만 사용
        }
        if (postsRes.data) setRecentPosts(postsRes.data);
      } catch (error) {
        console.error('Error loading talks data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    if (isToday) {
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const handlePostPress = () => {
    Alert.alert("알림", "게시글 상세 보기 화면은 준비 중입니다. (웹 연동 중)");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accentBlue} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* 1. Hero Section */}
      <View style={styles.heroSection}>
        <MessageSquare size={40} color="#fff" style={{ marginBottom: 12 }} />
        <Text style={styles.heroTitle}>Movie Talks</Text>
        <Text style={styles.heroSubtitle}>세상의 모든 영화에 대해 자유롭게 이야기하세요.</Text>
      </View>

      {/* 2. Hot Movies (Horizontal Scroll) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Flame color={Colors.accentRed} size={20} />
          <Text style={styles.sectionTitle}>지금 가장 뜨거운 영화</Text>
        </View>
        <FlatList
          horizontal
          data={hotMovies}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hotMoviesList}
          renderItem={({ item }) => (
            <Link href={`/movie/${item.id}` as any} asChild>
              <TouchableOpacity style={styles.hotMovieCard} activeOpacity={0.8}>
                <Image 
                  source={{ uri: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : 'https://via.placeholder.com/200x300/19191E/FFFFFF?text=No+Poster' }} 
                  style={styles.hotMoviePoster} 
                />
                <Text style={styles.hotMovieTitle} numberOfLines={1}>{item.title}</Text>
              </TouchableOpacity>
            </Link>
          )}
        />
      </View>

      {/* 3. Recent Posts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>최신 커뮤니티 글</Text>
        {recentPosts.map((post) => (
          <TouchableOpacity key={post.id} style={styles.postCard} onPress={handlePostPress} activeOpacity={0.7}>
            <View style={styles.postHeader}>
              <Text style={styles.postMovieTitle} numberOfLines={1}>{post.movie_title}</Text>
              <Text style={styles.postDate}>{formatDate(post.created_at)}</Text>
            </View>
            <View style={styles.postTitleRow}>
              {post.is_spoiler && (
                <View style={styles.spoilerBadge}>
                  <Text style={styles.spoilerText}>스포일러</Text>
                </View>
              )}
              <Text style={styles.postTitle} numberOfLines={1}>
                {post.title}
              </Text>
            </View>
            <View style={styles.postFooter}>
              <Text style={styles.postAuthor}>{post.author}</Text>
              <View style={styles.postStats}>
                <View style={styles.statItem}>
                  <Eye size={14} color={Colors.textMuted} />
                  <Text style={styles.statText}>{post.views || 0}</Text>
                </View>
                <View style={styles.statItem}>
                  <ThumbsUp size={14} color={Colors.textMuted} />
                  <Text style={styles.statText}>{post.likes || 0}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.darkBackground,
  },
  heroSection: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkCardBorder,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  section: {
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  hotMoviesList: {
    paddingHorizontal: 16,
  },
  hotMovieCard: {
    width: 120,
    marginRight: 12,
  },
  hotMoviePoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: '#333',
    marginBottom: 8,
  },
  hotMovieTitle: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: Colors.darkCardBg,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  postMovieTitle: {
    fontSize: 12,
    color: Colors.accentBlue,
    flex: 1,
  },
  postDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  postTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  spoilerBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.accentRed,
  },
  spoilerText: {
    color: Colors.accentRed,
    fontSize: 10,
    fontWeight: 'bold',
  },
  postTitle: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postAuthor: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  statText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginLeft: 4,
  },
});
