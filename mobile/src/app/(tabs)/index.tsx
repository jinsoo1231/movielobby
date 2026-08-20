import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/theme';
import { useEffect, useState } from 'react';
import { fetchTrendingMovies, fetchNowPlayingMovies, GENRE_MAP } from '@/lib/tmdb';
import { supabase } from '@/lib/supabase';
import { Star } from 'lucide-react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  const [movies, setMovies] = useState<any[]>([]);
  const [nowPlayingIds, setNowPlayingIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadMovies = async () => {
    try {
      const [tmdbData, playingData] = await Promise.all([
        fetchTrendingMovies(1),
        fetchNowPlayingMovies(),
      ]);
      
      if (!tmdbData || !tmdbData.results) return;

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

      setMovies(moviesWithRatings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovies();
  }, []);

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accentBlue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Trending Movies</Text>
      <FlatList 
        data={movies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMovie}
        contentContainerStyle={styles.listContent}
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
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    margin: 16,
    marginTop: 20,
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
