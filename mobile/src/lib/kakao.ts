const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY || '';

export const searchNearbyTheaters = async (lat: number, lng: number) => {
  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=영화관&x=${lng}&y=${lat}&radius=5000&category_group_code=CT1&sort=distance`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
        },
      }
    );
    const data = await response.json();
    if (data.errorType) {
      console.error('Kakao API Error:', data.message);
      return [];
    }
    return data.documents || [];
  } catch (error) {
    console.error('Error fetching nearby theaters:', error);
    return [];
  }
};
