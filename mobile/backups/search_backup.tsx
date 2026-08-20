import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react-native';
import { searchMovies } from '@/lib/tmdb';
import { Link } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Debouncing logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // Fetch search results
  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery.trim()) {
        setMovies([]);
        return;
      }

      setLoading(true);
      try {
        const data = await searchMovies(debouncedQuery);
        if (data && data.results) {
          setMovies(data.results);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const renderMovie = ({ item }: { item: any }) => {
    return (
      <Link href={`/movie/${item.id}` as any} asChild>
        <TouchableOpacity style={styles.card} activeOpacity={0.8}>
          <Image 
            source={{ uri: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/200x300/19191E/FFFFFF?text=No+Poster' }} 
            style={styles.poster} 
          />
          <View style={styles.infoContainer}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.date}>{item.release_date?.substring(0, 4) || '미정'}</Text>
            <Text style={styles.overview} numberOfLines={3}>{item.overview || '줄거리가 없습니다.'}</Text>
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <Search color={Colors.textMuted} size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="영화 제목을 검색해보세요..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.accentBlue} />
        </View>
      ) : movies.length > 0 ? (
        <FlatList
          data={movies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMovie}
          contentContainerStyle={styles.listContainer}
        />
      ) : debouncedQuery ? (
        <View style={styles.centerContainer}>
          <Text style={styles.noResultText}>'{debouncedQuery}'에 대한 검색 결과가 없습니다.</Text>
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <Search color={Colors.textMuted} size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <Text style={styles.noResultText}>찾고 싶은 영화를 검색해보세요.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkCardBg,
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noResultText: {
    color: Colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.darkCardBg,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.darkCardBorder,
  },
  poster: {
    width: 100,
    height: 150,
    backgroundColor: '#333',
  },
  infoContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
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
    marginBottom: 8,
  },
  overview: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 18,
  },
});
