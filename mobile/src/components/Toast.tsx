import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing } from '@/theme';

type ToastType = 'success' | 'error';
interface ToastState { message: string; type: ToastType }

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DURATION = 2200;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -16, duration: 180, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const show = useCallback(
    (message: string, type: ToastType = 'success') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, type });
      opacity.setValue(0);
      translateY.setValue(-16);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
      ]).start();
      timer.current = setTimeout(hide, DURATION);
    },
    [opacity, translateY, hide],
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const isError = toast?.type === 'error';

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            { top: insets.top + 10, opacity, transform: [{ translateY }] },
          ]}
        >
          <View
            style={[
              styles.toast,
              { backgroundColor: isError ? colors.dangerBg : colors.successBg, borderColor: isError ? colors.danger : colors.success },
            ]}
          >
            <Text style={[styles.icon, { color: isError ? colors.danger : colors.success }]}>
              {isError ? '!' : '✓'}
            </Text>
            <Text style={[styles.text, { color: isError ? colors.danger : colors.success }]} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: spacing.md,
    left: spacing.md,
    alignItems: 'flex-end',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 300,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    ...shadow.raised,
  },
  icon: {
    fontSize: 14,
    fontWeight: '900',
    width: 18,
    height: 18,
    lineHeight: 18,
    textAlign: 'center',
  },
  text: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
});
