/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#ffffff',
    foreground: '#000000',
    primary: '#032541',
    primaryHover: '#011424',
    cardBg: '#ffffff',
    cardBorder: '#e3e3e3',
    accentBlue: '#01b4e4',
    accentCyan: '#0ea5e9',
    accentRed: '#ef4444',
    success: '#10b981',
    danger: '#ef4444',
    textMuted: '#666666',
    darkBackground: '#0a0a0a',
    darkCardBg: '#1a1a1a',
    darkCardBorder: '#333333',
    backgroundSelected: '#f0f0f0',
    backgroundElement: '#e0e0e0',
    text: '#000000',
    textSecondary: '#666666',
  },
  dark: {
    background: '#0a0a0a',
    foreground: '#ffffff',
    primary: '#032541',
    primaryHover: '#011424',
    cardBg: '#1a1a1a',
    cardBorder: '#333333',
    accentBlue: '#01b4e4',
    accentCyan: '#0ea5e9',
    accentRed: '#ef4444',
    success: '#10b981',
    danger: '#ef4444',
    textMuted: '#aaaaaa',
    darkBackground: '#0a0a0a',
    darkCardBg: '#1a1a1a',
    darkCardBorder: '#333333',
    backgroundSelected: '#333333',
    backgroundElement: '#222222',
    text: '#ffffff',
    textSecondary: '#aaaaaa',
  },
  // Keep original flat ones just in case anything else uses them directly
  background: '#ffffff',
  foreground: '#000000',
  primary: '#032541',
  primaryHover: '#011424',
  cardBg: '#ffffff',
  cardBorder: '#e3e3e3',
  accentBlue: '#01b4e4',
  accentCyan: '#0ea5e9',
  accentRed: '#ef4444',
  success: '#10b981',
  danger: '#ef4444',
  textMuted: '#666666',
  darkBackground: '#0a0a0a',
  darkCardBg: '#1a1a1a',
  darkCardBorder: '#333333',
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
