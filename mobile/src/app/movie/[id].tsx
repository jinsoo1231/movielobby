import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { fetchMovieDetails } from '@/lib/tmdb';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { ChevronLeft, Star, User } from 'lucide-react-native';

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [movie, setMovie] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [localRating, setLocalRating] = useState('0.0');
  const [trailerId, setTrailerId] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        // Fetch Movie Details
        const tmdbData = await fetchMovieDetails(Number(id));
        if (tmdbData) {
          setMovie(tmdbData);
          
          // Extract Trailer & Gallery
          const foundTrailer = tmdbData.videos?.results?.find((v: any) => v.site === "YouTube" && v.type === "Trailer");
          if (foundTrailer) setTrailerId(foundTrailer.key);
          
          const backdrops = (tmdbData.images?.backdrops || []).slice(0, 4).map((img: any) => `https://image.tmdb.org/t/p/w500${img.file_path}`);
          setGallery(backdrops);
        }

        // Fetch Reviews
        const { data: reviewsData, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('movie_id', Number(id))
          .order('created_at', { ascending: false });

        if (reviewsData) {
          setReviews(reviewsData);
          if (reviewsData.length > 0) {
            const sum = reviewsData.reduce((acc: number, cur: any) => acc + cur.rating, 0);
            setLocalRating((sum / reviewsData.length).toFixed(1));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accentBlue} />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#fff' }}>영화 정보를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  const backdropUrl = `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`;
  const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft color="#fff" size={28} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Backdrop Image */}
        <View style={styles.backdropContainer}>
          <Image source={{ uri: backdropUrl }} style={styles.backdrop} />
          <View style={styles.backdropOverlay} />
        </View>

        {/* Movie Info Overlay */}
        <View style={styles.movieInfo}>
          <Image source={{ uri: posterUrl }} style={styles.poster} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.title}>{movie.title}</Text>
            <Text style={styles.originalTitle}>{movie.original_title}</Text>
            
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{movie.release_date?.substring(0, 4)}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{movie.runtime}분</Text>
            </View>

            <View style={styles.genreRow}>
              {movie.genres?.slice(0, 3).map((g: any) => (
                <View key={g.id} style={styles.genreBadge}>
                  <Text style={styles.genreText}>{g.name}</Text>
                </View>
              ))}
            </View>

          </View>
        </View>

        {/* Ratings */}
        <View style={styles.ratingSection}>
          <View style={styles.ratingBox}>
            <Text style={styles.ratingTitle}>MovieLobby</Text>
            <View style={styles.ratingScoreRow}>
              <Image source={require('../../../assets/images/icon_logo.png')} style={styles.mlIcon} />
              <Text style={styles.ratingScore}>{localRating}</Text>
            </View>
          </View>
          <View style={styles.ratingDivider} />
          <View style={styles.ratingBox}>
            <Text style={styles.ratingTitle}>TMDB</Text>
            <View style={styles.ratingScoreRow}>
              <Star size={20} color="#ef4444" fill="#ef4444" />
              <Text style={styles.ratingScore}>{movie.vote_average?.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Media Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>트레일러 & 미디어</Text>
          
          {/* Trailer */}
          {trailerId ? (
            <View style={styles.webviewContainer}>
              <YoutubePlayer
                height={Dimensions.get('window').width * (9 / 16)}
                play={false}
                videoId={trailerId}
                webViewStyle={{ backgroundColor: '#000' }}
              />
            </View>
          ) : (
            <View style={styles.noMediaContainer}>
              <Text style={styles.noMediaText}>제공되는 트레일러가 없습니다.</Text>
            </View>
          )}

          {/* Still Cuts */}
          {gallery.length > 0 ? (
            <FlatList
              horizontal
              data={gallery}
              keyExtractor={(item, idx) => idx.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryList}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.galleryImage} />
              )}
            />
          ) : (
            <Text style={styles.noMediaText}>제공되는 스틸컷이 없습니다.</Text>
          )}
        </View>

        {/* Synopsis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>줄거리</Text>
          <Text style={styles.overview}>{movie.overview || "등록된 줄거리가 없습니다."}</Text>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>사용자 리뷰 ({reviews.length})</Text>
          {reviews.length === 0 ? (
            <Text style={styles.noReviewText}>아직 작성된 리뷰가 없습니다.</Text>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewUser}>
                    <User size={16} color={Colors.textMuted} />
                    <Text style={styles.reviewUserId}>
                      {review.author || '익명'}
                    </Text>
                  </View>
                  <View style={styles.reviewStars}>
                    <Star size={14} color="#ef4444" fill="#ef4444" />
                    <Text style={styles.reviewRating}>{review.rating}</Text>
                  </View>
                </View>
                <Text style={styles.reviewContent}>{review.text}</Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>
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
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdropContainer: {
    width: '100%',
    height: 250,
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(25, 25, 30, 0.7)',
  },
  movieInfo: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -80,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  originalTitle: {
    color: Colors.textMuted,
    fontSize: 14,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaText: {
    color: '#ccc',
    fontSize: 14,
  },
  metaDot: {
    color: '#ccc',
    marginHorizontal: 8,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  genreBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  genreText: {
    color: '#ddd',
    fontSize: 12,
  },
  ratingSection: {
    flexDirection: 'row',
    backgroundColor: Colors.darkCardBg,
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
  },
  ratingBox: {
    flex: 1,
    alignItems: 'center',
  },
  ratingTitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  ratingScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mlIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  ratingScore: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  ratingDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.darkCardBorder,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  overview: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 24,
  },
  noReviewText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  reviewCard: {
    backgroundColor: Colors.darkCardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewUserId: {
    color: '#aaa',
    fontSize: 14,
  },
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reviewRating: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewContent: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  webviewContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  noMediaContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.darkCardBg,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
  },
  noMediaText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  galleryList: {
    paddingRight: 20,
    gap: 12,
  },
  galleryImage: {
    width: 240,
    height: 135,
    borderRadius: 8,
    backgroundColor: '#333',
  }
});
