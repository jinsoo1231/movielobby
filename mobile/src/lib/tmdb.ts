const TMDB_TOKEN = process.env.EXPO_PUBLIC_TMDB_TOKEN || '';
const BASE_URL = 'https://api.themoviedb.org/3';

export const GENRE_MAP: Record<number, string> = {
  28: '액션', 12: '모험', 16: '애니', 35: '코미디', 80: '범죄', 99: '다큐', 
  18: '드라마', 10751: '가족', 14: '판타지', 36: '역사', 27: '공포', 
  10402: '음악', 9648: '미스터리', 10749: '로맨스', 878: 'SF', 
  10770: 'TV영화', 53: '스릴러', 10752: '전쟁', 37: '서부'
};

export const fetchTrendingMovies = async (page = 1, year = 2026) => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?language=ko-KR&primary_release_year=${year}&sort_by=popularity.desc&page=${page}&vote_count.gte=100`, 
      {
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${TMDB_TOKEN}`,
        },
      }
    );
    return await response.json();
  } catch (error) {
    console.error('Error fetching movies:', error);
    return null;
  }
};

export const fetchNowPlayingMovies = async () => {
  try {
    const response = await fetch(`${BASE_URL}/movie/now_playing?language=ko-KR&page=1`, {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${TMDB_TOKEN}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching now playing movies:', error);
    return null;
  }
};

export const fetchMovieDetails = async (movieId: number) => {
  try {
    const response = await fetch(`${BASE_URL}/movie/${movieId}?language=ko-KR&append_to_response=credits,videos,images&include_image_language=ko,en,null&include_video_language=ko,en,null`, {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${TMDB_TOKEN}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return null;
  }
};

export const searchMovies = async (query: string, page = 1) => {
  if (!query) return null;
  try {
    const response = await fetch(
      `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=ko-KR&page=${page}`,
      {
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${TMDB_TOKEN}`,
        },
      }
    );
    return await response.json();
  } catch (error) {
    console.error('Error searching movies:', error);
    return null;
  }
};
