import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MessageSquare, Plus, Eye, ThumbsUp, Search, ChevronDown } from 'lucide-react-native';
import { fetchMovieDetails } from '@/lib/tmdb';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';

export default function TalkBoardScreen() {
  const { movieId } = useLocalSearchParams<{ movieId: string }>();
  const router = useRouter();
  
  const [movie, setMovie] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [bestPosts, setBestPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Search States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchType, setSearchType] = useState('title'); // 'title' or 'author'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const postsPerPage = 20;
  
  const totalPages = Math.ceil(totalCount / postsPerPage) || 1;

  const loadData = useCallback(async (page: number, query: string, type: string) => {
    try {
      setLoading(true);
      // 1. 영화 정보
      const movieData = await fetchMovieDetails(parseInt(movieId, 10));
      setMovie(movieData);

      // 2. BEST 추천글 (항상 로드, 조건 검색 무관)
      const { data: bestData } = await supabase
        .from('talk_posts')
        .select('id, title, author, views, likes, created_at, is_spoiler')
        .eq('movie_id', movieId)
        .gt('likes', 0)
        .order('likes', { ascending: false })
        .limit(3);
      if (bestData) setBestPosts(bestData);

      // 3. 일반 게시글 (페이징 및 검색)
      const start = (page - 1) * postsPerPage;
      const end = start + postsPerPage - 1;
      
      let req = supabase
        .from('talk_posts')
        .select('id, title, author, views, likes, created_at, is_spoiler', { count: 'exact' })
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (query.trim()) {
        if (type === 'title') {
          req = req.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
        } else if (type === 'author') {
          req = req.ilike('author', `%${query}%`);
        }
      }

      const { data: postsData, count } = await req;

      if (postsData) setPosts(postsData);
      if (count !== null) setTotalCount(count);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [movieId]);

  useFocusEffect(
    useCallback(() => {
      if (movieId) loadData(currentPage, searchQuery, searchType);
    }, [movieId, currentPage])
  );

  const handleSearchSubmit = () => {
    setCurrentPage(1);
    setIsSearching(true);
    loadData(1, searchQuery, searchType);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    if (isToday) {
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const handlePostPress = (post: any) => {
    router.push(`/talk-detail/${movieId}/${post.id}` as any);
  };

  if (loading || !movie) {
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
        <Text style={styles.headerTitle} numberOfLines={1}>{movie.title} 커뮤니티</Text>
        <Link href={`/talk-board/${movieId}/write` as any} asChild>
          <TouchableOpacity style={styles.writeHeaderBtn}>
            <Plus size={24} color={Colors.accentBlue} />
          </TouchableOpacity>
        </Link>
      </View>

      <ScrollView style={styles.content}>
        {/* Movie Info Banner */}
        <View style={styles.movieBanner}>
          <Image 
            source={{ uri: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : 'https://via.placeholder.com/200x300/19191E/FFFFFF?text=No+Poster' }} 
            style={styles.moviePoster} 
          />
          <View style={styles.movieInfo}>
            <Text style={styles.movieTitle}>{movie.title}</Text>
            <Text style={styles.movieYear}>{movie.release_date?.substring(0,4)}</Text>
            <Text style={styles.movieTagline} numberOfLines={2}>{movie.tagline || movie.overview}</Text>
          </View>
        </View>

        {/* BEST Posts */}
        {bestPosts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 BEST 추천글</Text>
            {bestPosts.map((post) => (
              <TouchableOpacity key={`best-${post.id}`} style={styles.bestPostCard} onPress={() => handlePostPress(post)} activeOpacity={0.7}>
                <View style={styles.postTitleRow}>
                  <View style={styles.bestBadge}>
                    <Text style={styles.bestBadgeText}>추천</Text>
                  </View>
                  {post.is_spoiler && (
                    <View style={styles.spoilerBadge}>
                      <Text style={styles.spoilerText}>스포일러</Text>
                    </View>
                  )}
                  <Text style={styles.bestPostTitle} numberOfLines={1}>{post.title}</Text>
                </View>
                <View style={styles.postFooter}>
                  <Text style={styles.postAuthor}>{post.author}</Text>
                  <View style={styles.postStats}>
                    <View style={styles.statItem}>
                      <Eye size={12} color={Colors.accentBlue} />
                      <Text style={[styles.statText, { color: Colors.accentBlue }]}>{post.views || 0}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <ThumbsUp size={12} color={Colors.accentRed} />
                      <Text style={[styles.statText, { color: Colors.accentRed }]}>{post.likes || 0}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* All Posts */}
        <View style={[styles.section, { paddingBottom: 100 }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>전체 글</Text>
            <Text style={styles.postCountText}>총 {posts.length}개</Text>
          </View>
          
          {posts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MessageSquare size={48} color={Colors.darkCardBorder} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyText}>아직 작성된 글이 없습니다.</Text>
              <Text style={styles.emptySubText}>첫 번째 글을 남겨보세요!</Text>
            </View>
          ) : (
            posts.map((post, index) => (
              <TouchableOpacity key={post.id} style={styles.postCard} onPress={() => handlePostPress(post)} activeOpacity={0.7}>
                <View style={styles.postTitleRow}>
                  <Text style={styles.postIndexText}>{totalCount - (currentPage - 1) * postsPerPage - index}</Text>
                  {post.is_spoiler && (
                    <View style={styles.spoilerBadge}>
                      <Text style={styles.spoilerText}>스포일러</Text>
                    </View>
                  )}
                  <Text style={styles.postTitle} numberOfLines={1}>{post.title}</Text>
                </View>
                <View style={styles.postFooter}>
                  <Text style={styles.postAuthor}>{post.author} · {formatDate(post.created_at)}</Text>
                  <View style={styles.postStats}>
                    <View style={styles.statItem}>
                      <Eye size={12} color={Colors.textMuted} />
                      <Text style={styles.statText}>{post.views || 0}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <ThumbsUp size={12} color={Colors.textMuted} />
                      <Text style={styles.statText}>{post.likes || 0}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <TouchableOpacity
                key={pageNum}
                style={[styles.pageButton, currentPage === pageNum && styles.pageButtonActive]}
                onPress={() => setCurrentPage(pageNum)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pageButtonText, currentPage === pageNum && styles.pageButtonTextActive]}>
                  {pageNum}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <TouchableOpacity 
            style={styles.searchTypeBtn}
            onPress={() => setSearchType(prev => prev === 'title' ? 'author' : 'title')}
            activeOpacity={0.8}
          >
            <Text style={styles.searchTypeText}>{searchType === 'title' ? '제목+내용' : '작성자'}</Text>
            <ChevronDown size={14} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.searchInputContainer}>
            <Search size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder={searchType === 'title' ? "검색어를 입력하세요" : "작성자를 입력하세요"}
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
          </View>
          {isSearching && <ActivityIndicator size="small" color={Colors.accentBlue} style={{ marginLeft: 10 }} />}
        </View>
        <View style={{ height: 100 }} />

      </ScrollView>

      {/* Floating Action Button */}
      <Link href={`/talk-board/${movieId}/write` as any} asChild>
        <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
          <Plus size={24} color="#fff" />
          <Text style={styles.fabText}>글쓰기</Text>
        </TouchableOpacity>
      </Link>
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
  writeHeaderBtn: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  movieBanner: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: Colors.darkCardBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkCardBorder,
    alignItems: 'center',
  },
  moviePoster: {
    width: 60,
    height: 90,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#333',
  },
  movieInfo: {
    flex: 1,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  movieYear: {
    color: Colors.accentBlue,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  movieTagline: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  postCountText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  bestPostCard: {
    backgroundColor: 'rgba(14, 165, 233, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.2)',
    marginBottom: 12,
  },
  bestPostTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
  },
  postCard: {
    backgroundColor: Colors.darkCardBg,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
    marginBottom: 12,
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
    borderColor: Colors.light.danger,
  },
  spoilerText: {
    color: Colors.light.danger,
    fontSize: 10,
    fontWeight: 'bold',
  },
  postTitle: {
    color: '#fff',
    fontSize: 15,
    flex: 1,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postAuthor: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  postStats: {
    flexDirection: 'row',
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
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  bestBadge: {
    borderWidth: 1,
    borderColor: Colors.accentBlue,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
  },
  bestBadgeText: {
    color: Colors.accentBlue,
    fontSize: 10,
    fontWeight: 'bold',
  },
  postIndexText: {
    color: Colors.textMuted,
    fontSize: 12,
    width: 24,
    textAlign: 'center',
    marginRight: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.darkCardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageButtonActive: {
    backgroundColor: Colors.accentBlue,
  },
  pageButtonText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  pageButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkCardBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
    marginRight: 8,
  },
  searchTypeText: {
    color: '#fff',
    fontSize: 13,
    marginRight: 4,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkCardBg,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    paddingVertical: 10,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 50,
    backgroundColor: Colors.accentBlue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});
