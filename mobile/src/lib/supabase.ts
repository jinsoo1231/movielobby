import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// [제1조 2항 준수] 모바일 전용 로컬 스토리지 연동
// 웹 브라우저의 localStorage 대신, React Native 환경에서는 AsyncStorage를 사용하여 로그인 세션(토큰)을 기기에 안전하게 저장합니다.
// 이 덕분에 앱을 강제 종료하고 다시 켜도 로그인이 풀리지 않습니다.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true, // 로그인 자동 유지 활성화
    detectSessionInUrl: false,
  },
});
