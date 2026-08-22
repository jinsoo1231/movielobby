import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '@/constants/theme';
import { useEffect, useState } from 'react';
import { fetchTrendingMovies, fetchNowPlayingMovies, GENRE_MAP } from '@/lib/tmdb';
import { supabase } from '@/lib/supabase';
import { Star } from 'lucide-react-native';
import { Link } from 'expo-router';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1949 }, (_, i) => CURRENT_YEAR - i);

export default function HomeScreen() {
  const [movies, setMovies] = useState<any[]>([]);
  const [nowPlayingIds, setNowPlayingIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);

  const loadMovies = async (pageNum: number, year: number, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setIsFetchingMore(true);

    try {
      const [tmdbData, playingData] = await Promise.all([
        fetchTrendingMovies(pageNum, year),
        pageNum === 1 ? fetchNowPlayingMovies() : Promise.resolve(null),
      ]);
      
      if (!tmdbData || !tmdbData.results) {
        setHasMore(false);
        return;
      }

      if (tmdbData.results.length === 0) {
        setHasMore(false);
      }

      if (playingData && playingData.results) {
        setNowPlayingIds(new Set(playingData.results.map((m: any) => m.id)));
      }

      const moviesData = tmdbData.results;
      
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('movie_id, rating')
        .in('movie_id', moviesData.map((m: any) => m.id));

      const ratingMap: Record<number, { sum: number; count: number }> = {};
      if (reviewsData) {
        reviewsData.forEach((review: any) => {
          if (!ratingMap[review.movie_id]) {
            ratingMap[review.movie_id] = { sum: 0, count: 0 };
          }
          ratingMap[review.movie_id].sum += review.rating;
          ratingMap[review.movie_id].count += 1;
        });
      }

      const moviesWithRatings = moviesData.map((movie: any) => {
        const stats = ratingMap[movie.id];
        const localRating = stats ? (stats.sum / stats.count).toFixed(1) : '0.0';
        return {
          ...movie,
          localRating
        };
      });

      setMovies(prev => append ? [...prev, ...moviesWithRatings] : moviesWithRatings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadMovies(1, selectedYear, false);
  }, [selectedYear]);

  const handleLoadMore = () => {
    if (!loading && !isFetchingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadMovies(nextPage, selectedYear, true);
    }
  };

  const renderMovie = ({ item, index }: { item: any; index: number }) => {
    const isPlaying = nowPlayingIds.has(item.id);
    const rank = index + 1;
    const genres = (item.genre_ids || [])
      .map((id: number) => GENRE_MAP[id])
      .filter(Boolean)
      .slice(0, 3)
      .join(' ');

    return (
      <Link href={`/movie/${item.id}` as any} asChild>
        <TouchableOpacity style={styles.card} activeOpacity={0.8}>
          <View style={styles.posterContainer}>
            <Image 
              source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }} 
              style={styles.poster} 
            />
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{rank}</Text>
            </View>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.date}>{item.release_date}</Text>
            <Text style={styles.genres} numberOfLines={1}>{genres}</Text>
            
            <View style={styles.bottomRow}>
              <View style={styles.ratingContainer}>
                <View style={styles.ratingBadge}>
                  <Image source={require('../../../assets/images/icon_logo.png')} style={styles.mlIcon} />
                  <Text style={styles.ratingNumber}>{item.localRating}</Text>
                </View>

                <View style={styles.ratingBadge}>
                  <Star size={14} color="#ef4444" fill="#ef4444" />
                  <Text style={styles.ratingNumber}>{item.vote_average?.toFixed(1) || "0.0"}</Text>
                </View>
              </View>

              <View style={[styles.statusBadge, isPlaying ? styles.statusPlaying : styles.statusEnded]}>
                <Text style={styles.statusText}>{isPlaying ? '상영중' : '상영종료'}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Discover Movies</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.yearScroll} 
        contentContainerStyle={styles.yearScrollContent}
      >
        {YEARS.map(y => (
          <TouchableOpacity 
            key={y} 
            style={[styles.yearChip, selectedYear === y && styles.yearChipActive]}
            onPress={() => setSelectedYear(y)}
          >
            <Text style={[styles.yearText, selectedYear === y && styles.yearTextActive]}>{y}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingMore) return <View style={{ height: 40 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.accentBlue} />
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accentBlue} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList 
        data={movies}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderMovie}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
  },
  center: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  yearScroll: {
    flexGrow: 0,
  },
  yearScrollContent: {
    paddingRight: 16,
    gap: 8,
  },
  yearChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.darkCardBg,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
  },
  yearChipActive: {
    backgroundColor: Colors.accentBlue,
    borderColor: Colors.accentBlue,
  },
  yearText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  yearTextActive: {
    color: '#fff',
  },
  footerLoader: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.darkCardBg,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderColor: Colors.darkCardBorder,
    borderWidth: 1,
  },
  posterContainer: {
    position: 'relative',
    width: 110,
    height: 165,
  },
  poster: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
  },
  rankBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.9)', // Colors.danger
    width: 28,
    height: 28,
    borderBottomRightRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    color: Colors.textMuted,
    fontSize: 14,
    marginBottom: 4,
  },
  genres: {
    color: Colors.accentBlue,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 6,
  },
  mlIcon: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  ratingNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusPlaying: {
    backgroundColor: '#10b981', // Colors.success
  },
  statusEnded: {
    backgroundColor: '#333',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
