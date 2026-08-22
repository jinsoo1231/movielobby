import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, FlatList, Dimensions, TextInput, Alert } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useLocalSearchParams, Stack, useRouter, Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal } from 'react-native';
import * as Location from 'expo-location';
import { fetchMovieDetails, fetchCollectionDetails } from '@/lib/tmdb';
import { searchNearbyTheaters } from '@/lib/kakao';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, Star, User, ThumbsUp, ThumbsDown, MessageSquare, Send, MapPin, Navigation, X } from 'lucide-react-native';
import { Linking } from 'react-native';

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [movie, setMovie] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [localRating, setLocalRating] = useState('0.0');
  const [trailerId, setTrailerId] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [collection, setCollection] = useState<any>(null);

  // [제1조 2항 준수] 한줄평 작성 및 투표 관련 상태 관리
  const [selectedRating, setSelectedRating] = useState<number>(0); // 1~10점 (5개 별, 별당 2점)
  const [reviewText, setReviewText] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [userVotes, setUserVotes] = useState<Record<string, 'like' | 'dislike'>>({});
  const [isVoting, setIsVoting] = useState<Record<string, boolean>>({});

  // 예매(내 주변 영화관) 관련 상태
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingTheaters, setBookingTheaters] = useState<any[]>([]);
  const [isLocating, setIsLocating] = useState(false);

  // 로그인 유저의 닉네임 추출 (우선순위: 1) metadata.nickname, 2) metadata.name, 3) 이메일 아이디)
  const userNickname = user?.user_metadata?.nickname || user?.user_metadata?.name || user?.email?.split('@')[0] || '';

  // [제1조 2항 준수] 영화 상세 정보 및 리뷰 & 투표 이력 동시 로드
  useEffect(() => {
    const loadDetail = async () => {
      try {
        // 1. TMDB 영화 상세 정보 호출
        const tmdbData = await fetchMovieDetails(Number(id));
        if (tmdbData) {
          setMovie(tmdbData);
          
          // 트레일러 및 스틸컷 갤러리 추출
          const foundTrailer = tmdbData.videos?.results?.find((v: any) => v.site === "YouTube" && v.type === "Trailer");
          if (foundTrailer) setTrailerId(foundTrailer.key);
          
          const backdrops = (tmdbData.images?.backdrops || []).slice(0, 4).map((img: any) => `https://image.tmdb.org/t/p/w500${img.file_path}`);
          setGallery(backdrops);

          // 프랜차이즈 컬렉션 타임라인 로드
          if (tmdbData.belongs_to_collection) {
            const collectionData = await fetchCollectionDetails(tmdbData.belongs_to_collection.id);
            if (collectionData && collectionData.parts) {
              // 개봉일 기준 오름차순 정렬
              collectionData.parts.sort((a: any, b: any) => {
                if (!a.release_date) return 1;
                if (!b.release_date) return -1;
                return new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
              });
              setCollection(collectionData);
            }
          }
        }

        // 2. Supabase에서 해당 영화의 한줄평 리뷰 목록 조회
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('movie_id', Number(id))
          .order('created_at', { ascending: false });

        if (reviewsData) {
          setReviews(reviewsData);
          if (reviewsData.length > 0) {
            const sum = reviewsData.reduce((acc: number, cur: any) => acc + cur.rating, 0);
            setLocalRating((sum / reviewsData.length).toFixed(1));
          } else {
            setLocalRating('0.0');
          }
        }

        // 3. 로그인한 유저의 기존 리뷰 투표 이력 조회 (vote_logs 테이블)
        // context의 user가 없더라도 Supabase 클라이언트에서 직접 세션 조회 시도
        let activeUser = user;
        if (!activeUser) {
          const { data: { user: directUser } } = await supabase.auth.getUser();
          activeUser = directUser;
        }

        if (activeUser) {
          const { data: voteLogs } = await supabase
            .from('vote_logs')
            .select('target_id, vote_type')
            .eq('user_id', activeUser.id)
            .eq('target_type', 'review');

          if (voteLogs) {
            const voteMap: Record<string, 'like' | 'dislike'> = {};
            voteLogs.forEach((v: any) => {
              voteMap[String(v.target_id)] = v.vote_type;
            });
            setUserVotes(voteMap);
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
  }, [id, user]);

  const handleOpenBooking = async () => {
    setShowBookingModal(true);
    setIsLocating(true);
    
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 오류', '위치 접근 권한이 거부되었습니다.');
        setIsLocating(false);
        return;
      }
      
      let loc = await Location.getCurrentPositionAsync({});
      const places = await searchNearbyTheaters(loc.coords.latitude, loc.coords.longitude);
      setBookingTheaters(places);
    } catch (e) {
      Alert.alert('오류', '위치 정보를 가져오는데 실패했습니다.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleBookTheater = (theaterName: string) => {
    const query = encodeURIComponent(theaterName);
    Linking.openURL(`https://m.search.naver.com/search.naver?query=${query}`);
  };

  // [제1조 2항 준수] 한줄평 등록 처리 로직
  const handleReviewSubmit = async () => {
    // 1. 로그인 상태 확인 (useAuth 및 Supabase 클라이언트 이중 확인)
    let activeUser = user;
    if (!activeUser) {
      const { data: { user: directUser } } = await supabase.auth.getUser();
      activeUser = directUser;
    }

    if (!activeUser) {
      Alert.alert(
        '로그인 필요',
        '한줄평을 작성하려면 로그인이 필요합니다.\n마이페이지로 이동하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '로그인하기', onPress: () => router.push('/(tabs)/mypage' as any) }
        ]
      );
      return;
    }

    // 2. 입력값 유효성 검사
    if (selectedRating === 0) {
      Alert.alert('알림', '별점을 먼저 선택해주세요.');
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert('알림', '감상평 내용을 작성해주세요.');
      return;
    }

    setIsSubmittingReview(true);

    try {
      const currentNickname = activeUser.user_metadata?.nickname || activeUser.user_metadata?.name || activeUser.email?.split('@')[0] || '익명';

      const newReviewPayload = {
        movie_id: Number(id),
        author: currentNickname,
        text: reviewText.trim(),
        rating: selectedRating,
        likes: 0,
        dislikes: 0
      };

      const { data, error } = await supabase
        .from('reviews')
        .insert([newReviewPayload])
        .select();

      if (error) {
        console.error('Review insert error:', error);
        Alert.alert('오류', '리뷰 등록에 실패했습니다. 다시 시도해주세요.');
      } else if (data && data[0]) {
        const createdReview = data[0];
        const updatedList = [createdReview, ...reviews];
        setReviews(updatedList);

        // 평점 평균 즉시 갱신
        const sum = updatedList.reduce((acc: number, cur: any) => acc + cur.rating, 0);
        setLocalRating((sum / updatedList.length).toFixed(1));

        // 폼 초기화
        setReviewText('');
        setSelectedRating(0);
        Alert.alert('등록 완료 🎉', '소중한 한줄평이 성공적으로 등록되었습니다!');
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('오류', '시스템 에러가 발생했습니다.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // [제1조 2항 준수] 리뷰 1인 1회 추천/비추천 투표 처리 로직 (vote_logs 연동)
  const handleVoteReview = async (reviewId: number | string, type: 'like' | 'dislike') => {
    let activeUser = user;
    if (!activeUser) {
      const { data: { user: directUser } } = await supabase.auth.getUser();
      activeUser = directUser;
    }

    if (!activeUser) {
      Alert.alert(
        '로그인 필요',
        '추천/비추천은 로그인 후 이용하실 수 있습니다.\n로그인 화면으로 이동하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '로그인하기', onPress: () => router.push('/(tabs)/mypage' as any) }
        ]
      );
      return;
    }

    const targetIdStr = String(reviewId);

    // 이미 투표한 이력이 있는지 확인
    if (userVotes[targetIdStr]) {
      Alert.alert('알림', '이미 참여하신 리뷰입니다. (1인 1회만 참여 가능)');
      return;
    }

    if (isVoting[targetIdStr]) return;
    setIsVoting(prev => ({ ...prev, [targetIdStr]: true }));

    try {
      // 1. vote_logs 중복 방지 레코드 삽입
      const { error: logError } = await supabase
        .from('vote_logs')
        .insert([{
          user_id: activeUser.id,
          target_type: 'review',
          target_id: targetIdStr,
          vote_type: type
        }]);

      if (logError) {
        if (logError.code === '23505') {
          Alert.alert('알림', '이미 참여하신 리뷰입니다.');
        } else {
          console.error('Vote log error:', logError);
          Alert.alert('오류', '투표 처리에 실패했습니다.');
        }
        return;
      }

      // 2. 로컬 상태 및 DB 카운트 증가
      setUserVotes(prev => ({ ...prev, [targetIdStr]: type }));

      const targetReview = reviews.find(r => r.id === reviewId);
      if (targetReview) {
        const newLikes = type === 'like' ? (targetReview.likes || 0) + 1 : (targetReview.likes || 0);
        const newDislikes = type === 'dislike' ? (targetReview.dislikes || 0) + 1 : (targetReview.dislikes || 0);

        setReviews(reviews.map(r => r.id === reviewId ? { ...r, likes: newLikes, dislikes: newDislikes } : r));

        await supabase
          .from('reviews')
          .update({ likes: newLikes, dislikes: newDislikes })
          .eq('id', reviewId);
      }
    } catch (e) {
      console.error('Vote error:', e);
    } finally {
      setIsVoting(prev => ({ ...prev, [targetIdStr]: false }));
    }
  };

  // 날짜 포맷 헬퍼 함수
  const formatReviewDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft color="#fff" size={28} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
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

      {/* 5-3. 프랜차이즈 시리즈 타임라인 */}
      {collection && collection.parts && collection.parts.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{collection.name} 타임라인</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timelineScroll} contentContainerStyle={styles.timelineScrollContent}>
            {collection.parts.map((part: any, index: number) => {
              const isCurrent = part.id === movie.id;
              return (
                <Link key={part.id} href={`/movie/${part.id}` as any} asChild>
                  <TouchableOpacity style={StyleSheet.flatten([styles.timelineCard, isCurrent && styles.timelineCardCurrent])}>
                    <Image 
                      source={{ uri: part.poster_path ? `https://image.tmdb.org/t/p/w200${part.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Image' }} 
                      style={[styles.timelinePoster, isCurrent && styles.timelinePosterCurrent]} 
                    />
                    <Text style={[styles.timelineTitle, isCurrent && styles.timelineTitleCurrent]} numberOfLines={2}>
                      {index + 1}. {part.title}
                    </Text>
                    <Text style={styles.timelineDate}>{part.release_date ? part.release_date.substring(0, 4) : '미정'}</Text>
                    {isCurrent && (
                      <View style={styles.timelineCurrentBadge}>
                        <Text style={styles.timelineCurrentText}>현재 영화</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Link>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 리뷰 목록 영역 */}
      <View style={styles.reviewSection}>
          <View style={styles.ratingBox}>
            <Text style={styles.ratingTitle}>MovieLobby 평점</Text>
            <View style={styles.ratingScoreRow}>
              <Image source={require('../../../assets/images/icon_logo.png')} style={styles.mlIcon} />
              <Text style={styles.ratingScore}>{localRating}</Text>
            </View>
          </View>
          <View style={styles.ratingDivider} />
          <View style={styles.ratingBox}>
            <Text style={styles.ratingTitle}>TMDB 평점</Text>
            <View style={styles.ratingScoreRow}>
              <Star size={20} color="#ef4444" fill="#ef4444" />
              <Text style={styles.ratingScore}>{movie.vote_average?.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Booking Shortcut Banner */}
        <View style={styles.talksBannerContainer}>
          <TouchableOpacity style={[styles.talksBanner, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }]} activeOpacity={0.8} onPress={handleOpenBooking}>
            <View style={styles.talksBannerLeft}>
              <MapPin size={22} color="#ef4444" style={{ marginRight: 10 }} />
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.talksBannerTitle, { color: '#ef4444' }]} numberOfLines={1}>내 주변 상영관 예매하기</Text>
                <Text style={styles.talksBannerDesc} numberOfLines={2}>현재 위치 기반으로 가까운 영화관을 찾아드려요!</Text>
              </View>
            </View>
            <View style={[styles.talksBannerBadge, { backgroundColor: '#ef4444' }]}>
              <Text style={styles.talksBannerBadgeText}>찾기</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Talks Shortcut Banner */}
        <View style={styles.talksBannerContainer}>
          <Link href={`/talk-board/${id}` as any} asChild>
            <TouchableOpacity style={styles.talksBanner} activeOpacity={0.8}>
              <View style={styles.talksBannerLeft}>
                <MessageSquare size={22} color={Colors.accentBlue} style={{ marginRight: 10 }} />
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.talksBannerTitle} numberOfLines={1}>Movie Talks 커뮤니티</Text>
                  <Text style={styles.talksBannerDesc} numberOfLines={2}>더 깊이 있는 영화 감상평이나 토론을 나눠보세요!</Text>
                </View>
              </View>
              <View style={styles.talksBannerBadge}>
                <Text style={styles.talksBannerBadgeText}>입장</Text>
              </View>
            </TouchableOpacity>
          </Link>
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

        {/* --- [Phase 1 구현] 한줄평 작성 폼 섹션 --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>한줄평 남기기</Text>
          
          <View style={styles.writeFormCard}>
            {/* 별점 선택 UI (5개 별 = 2점씩 총 10점 만점) */}
            <Text style={styles.writeStarTitle}>별점을 선택해주세요</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((starIdx) => {
                const scoreVal = starIdx * 2;
                const isSelected = selectedRating >= scoreVal;
                return (
                  <TouchableOpacity
                    key={starIdx}
                    onPress={() => setSelectedRating(scoreVal)}
                    style={styles.starTouch}
                    activeOpacity={0.7}
                  >
                    <Star
                      size={32}
                      color={isSelected ? "#ef4444" : "#4b5563"}
                      fill={isSelected ? "#ef4444" : "transparent"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.selectedScoreText}>
              {selectedRating > 0 ? `${selectedRating}점 / 10점` : '별점을 터치하여 점수를 매겨주세요'}
            </Text>

            {/* 유저 상태 정보 */}
            <View style={styles.writerInfoRow}>
              <View style={styles.writerBadge}>
                <User size={14} color={user ? Colors.accentBlue : Colors.textMuted} />
                <Text style={[styles.writerText, user ? { color: Colors.accentBlue } : { color: Colors.textMuted }]}>
                  {user ? `${userNickname} (로그인됨)` : '로그인 필요'}
                </Text>
              </View>
              <Text style={styles.charCounter}>{reviewText.length} / 200자</Text>
            </View>

            {/* 한줄평 입력창 */}
            <TextInput
              style={styles.reviewInput}
              placeholder={user ? "영화에 대한 솔직한 감상평을 남겨주세요 (최대 200자)..." : "로그인 후 한줄평을 작성하실 수 있습니다."}
              placeholderTextColor={Colors.textMuted}
              value={reviewText}
              onChangeText={setReviewText}
              maxLength={200}
              multiline
              editable={!isSubmittingReview}
            />

            {/* 등록 버튼 */}
            <TouchableOpacity
              style={[
                styles.submitReviewBtn,
                (!selectedRating || !reviewText.trim() || isSubmittingReview) ? styles.submitBtnDisabled : {}
              ]}
              onPress={handleReviewSubmit}
              disabled={isSubmittingReview}
              activeOpacity={0.8}
            >
              {isSubmittingReview ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Send size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.submitBtnText}>한줄평 등록</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* --- 리뷰 목록 & 추천/비추천 섹션 --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>사용자 리뷰 ({reviews.length})</Text>
          {reviews.length === 0 ? (
            <View style={styles.emptyReviewBox}>
              <MessageSquare size={36} color={Colors.textMuted} style={{ marginBottom: 10, opacity: 0.5 }} />
              <Text style={styles.noReviewText}>아직 작성된 리뷰가 없습니다.</Text>
              <Text style={styles.noReviewSubText}>첫 번째 한줄평의 주인공이 되어보세요!</Text>
            </View>
          ) : (
            reviews.map((review) => {
              const hasVoted = userVotes[String(review.id)];
              return (
                <View key={review.id} style={styles.reviewCard}>
                  {/* 리뷰 헤더 */}
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewUser}>
                      <View style={styles.userAvatarSmall}>
                        <User size={14} color="#fff" />
                      </View>
                      <View>
                        <Text style={styles.reviewUserId}>
                          {review.author || '익명'}
                        </Text>
                        <Text style={styles.reviewDate}>{formatReviewDate(review.created_at)}</Text>
                      </View>
                    </View>

                    {/* 별점 배지 */}
                    <View style={styles.reviewStars}>
                      <Star size={14} color="#ef4444" fill="#ef4444" />
                      <Text style={styles.reviewRating}>{review.rating}점</Text>
                    </View>
                  </View>

                  {/* 리뷰 본문 */}
                  <Text style={styles.reviewContent}>{review.text}</Text>

                  {/* 리뷰 추천 / 비추천 (1인 1회 투표) 버튼 */}
                  <View style={styles.voteButtonGroup}>
                    <TouchableOpacity
                      style={[
                        styles.voteBtn,
                        hasVoted === 'like' ? styles.voteBtnLiked : {}
                      ]}
                      onPress={() => handleVoteReview(review.id, 'like')}
                      activeOpacity={0.7}
                    >
                      <ThumbsUp
                        size={14}
                        color={hasVoted === 'like' ? Colors.accentBlue : Colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.voteCountText,
                          hasVoted === 'like' ? { color: Colors.accentBlue, fontWeight: 'bold' } : {}
                        ]}
                      >
                        {review.likes || 0}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.voteBtn,
                        hasVoted === 'dislike' ? styles.voteBtnDisliked : {}
                      ]}
                      onPress={() => handleVoteReview(review.id, 'dislike')}
                      activeOpacity={0.7}
                    >
                      <ThumbsDown
                        size={14}
                        color={hasVoted === 'dislike' ? Colors.accentRed : Colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.voteCountText,
                          hasVoted === 'dislike' ? { color: Colors.accentRed, fontWeight: 'bold' } : {}
                        ]}
                      >
                        {review.dislikes || 0}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>

      {/* 주변 상영관 모달 */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>내 주변 영화관</Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)} style={styles.modalCloseBtn}>
                <X size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            
            {isLocating ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={Colors.accentBlue} />
                <Text style={styles.modalLoadingText}>주변 상영관을 찾는 중...</Text>
              </View>
            ) : bookingTheaters.length === 0 ? (
              <View style={styles.modalLoading}>
                <Text style={styles.modalLoadingText}>반경 5km 내에 영화관이 없습니다.</Text>
              </View>
            ) : (
              <FlatList
                data={bookingTheaters}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.theaterCard} onPress={() => handleBookTheater(item.place_name)}>
                    <View style={styles.theaterInfo}>
                      <Text style={styles.theaterName}>{item.place_name}</Text>
                      <Text style={styles.theaterDistance}>📍 {item.distance}m</Text>
                    </View>
                    <View style={styles.bookingBtn}>
                      <Text style={styles.bookingBtnText}>예매하기</Text>
                      <Navigation size={14} color="#fff" style={{ marginLeft: 4 }} />
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        </View>
      </Modal>

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
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: 'rgba(25, 25, 30, 0.75)',
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
  talksBannerContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  talksBanner: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  talksBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  talksBannerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  talksBannerDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  talksBannerBadge: {
    backgroundColor: Colors.accentBlue,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 8,
  },
  talksBannerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  overview: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 24,
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
    height: 140,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  timelineScroll: {
    marginTop: 12,
  },
  timelineScrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  timelineCard: {
    width: 120,
    position: 'relative',
  },
  timelineCardCurrent: {
    opacity: 1,
  },
  timelinePoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timelinePosterCurrent: {
    borderColor: Colors.accentBlue,
  },
  timelineTitle: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timelineTitleCurrent: {
    color: '#fff',
  },
  timelineDate: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  timelineCurrentBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.accentBlue,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timelineCurrentText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reviewSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  // 한줄평 작성 폼 스타일
  writeFormCard: {
    backgroundColor: Colors.darkCardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
  },
  writeStarTitle: {
    color: '#eee',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 6,
  },
  starTouch: {
    padding: 4,
  },
  selectedScoreText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 14,
  },
  writerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  writerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  writerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  charCounter: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  reviewInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
    marginBottom: 12,
  },
  submitReviewBtn: {
    backgroundColor: Colors.accentBlue,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  // 리뷰 목록 스타일
  emptyReviewBox: {
    backgroundColor: Colors.darkCardBg,
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
  },
  noReviewText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  noReviewSubText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  reviewCard: {
    backgroundColor: Colors.darkCardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewUserId: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewDate: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  reviewRating: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 13,
  },
  reviewContent: {
    color: '#e5e7eb',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  voteButtonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  voteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
    gap: 6,
  },
  voteBtnLiked: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderColor: Colors.accentBlue,
  },
  voteBtnDisliked: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: Colors.accentRed,
  },
  voteCountText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.darkBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLoadingText: {
    color: Colors.textMuted,
    marginTop: 12,
  },
  theaterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkCardBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
  },
  theaterInfo: {
    flex: 1,
  },
  theaterName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  theaterDistance: {
    color: Colors.accentBlue,
    fontSize: 14,
    fontWeight: '600',
  },
  bookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bookingBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
