import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Linking, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import { searchNearbyTheaters } from '@/lib/kakao';
import { Colors } from '@/constants/theme';
import { MapPin, Navigation } from 'lucide-react-native';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [theaters, setTheaters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('위치 접근 권한이 거부되었습니다.');
        setLoading(false);
        return;
      }

      try {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);

        // Fetch nearby theaters
        const places = await searchNearbyTheaters(loc.coords.latitude, loc.coords.longitude);
        setTheaters(places);
      } catch (error) {
        setErrorMsg('위치 정보를 가져오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openTheaterSearch = (theaterName: string) => {
    const query = encodeURIComponent(theaterName);
    Linking.openURL(`https://m.search.naver.com/search.naver?query=${query}`);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accentBlue} />
        <Text style={styles.loadingText}>주변 상영관을 찾는 중...</Text>
      </View>
    );
  }

  if (errorMsg || !location) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{errorMsg || '알 수 없는 오류'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MapPin size={32} color={Colors.accentBlue} style={{ marginBottom: 12 }} />
        <Text style={styles.headerTitle}>내 주변 영화관 탐색</Text>
        <Text style={styles.headerDesc}>현재 위치를 기반으로 가까운 상영관을 찾아드려요!</Text>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>검색된 영화관 ({theaters.length})</Text>
        <FlatList
          data={theaters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.theaterCard} onPress={() => openTheaterSearch(item.place_name)}>
              <View style={styles.theaterInfo}>
                <Text style={styles.theaterName}>{item.place_name}</Text>
                <Text style={styles.theaterAddress}>{item.road_address_name || item.address_name}</Text>
                <Text style={styles.theaterDistance}>📍 {item.distance}m</Text>
              </View>
              <View style={styles.actionButton}>
                <Text style={styles.actionButtonText}>상영시간표</Text>
                <Navigation size={14} color={Colors.accentBlue} style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>반경 5km 내에 영화관이 없습니다.</Text>
          }
        />
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.darkBackground,
  },
  loadingText: {
    color: Colors.textMuted,
    marginTop: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: Colors.darkBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkCardBorder,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  headerDesc: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
    padding: 20,
  },
  listTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
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
    marginBottom: 4,
  },
  theaterAddress: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  theaterDistance: {
    color: Colors.accentBlue,
    fontSize: 13,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: Colors.accentBlue,
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
});
