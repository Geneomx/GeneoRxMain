import React, { createContext, forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { Keyboard, ScrollView, type ScrollViewInstance, type ScrollViewProps, TextInput, type TextInputInstance } from 'react-native';

export const FormFocusContext = createContext<(input: TextInputInstance | null) => void>(() => undefined);

/** Recheck the focused field after the keyboard resizes a screen or bottom sheet. */
export const FormScrollView = forwardRef<ScrollViewInstance, ScrollViewProps>((props, forwardedRef) => {
  const scroll = useRef<ScrollViewInstance>(null);
  const keyboardOpen = useRef(Keyboard.isVisible());
  const keyboardTop = useRef(Keyboard.metrics()?.screenY ?? Number.POSITIVE_INFINITY);
  const offsetY = useRef(0);
  const ownedInput = useRef<ReturnType<typeof TextInput.State.currentlyFocusedInput>>(null);
  const frame = useRef<number | null>(null);
  useImperativeHandle(forwardedRef, () => scroll.current!, []);
  const revealFocus = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      if (!keyboardOpen.current) return;
      const input = TextInput.State.currentlyFocusedInput();
      if (!input || input !== ownedInput.current) return;
      // React Native's keyboard helper assumes a full-screen scroll view.
      // Bottom sheets need both measurements in the same window coordinates.
      scroll.current?.getNativeScrollRef()?.measureInWindow((_x, scrollTop, _width, scrollHeight) => {
        input.measureInWindow((_left, top, _inputWidth, height) => {
          if (input !== TextInput.State.currentlyFocusedInput() || !scrollHeight || !height) return;
          const bottom = Math.min(scrollTop + scrollHeight, keyboardTop.current) - 24;
          const delta = top + height > bottom ? top + height - bottom : top < scrollTop + 12 ? top - scrollTop - 12 : 0;
          if (Math.abs(delta) > 1) scroll.current?.scrollTo({ y: Math.max(0, offsetY.current + delta), animated: true });
        });
      });
    });
  }, []);
  const onChildFocus = useCallback((input: TextInputInstance | null) => {
    ownedInput.current = input;
    revealFocus();
  }, [revealFocus]);
  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', event => { keyboardOpen.current = true; keyboardTop.current = event.endCoordinates.screenY; revealFocus(); });
    const hidden = Keyboard.addListener('keyboardDidHide', () => { keyboardOpen.current = false; keyboardTop.current = Number.POSITIVE_INFINITY; });
    return () => { shown.remove(); hidden.remove(); if (frame.current !== null) cancelAnimationFrame(frame.current); };
  }, [revealFocus]);
  return <FormFocusContext.Provider value={onChildFocus}><ScrollView {...props} ref={scroll} keyboardShouldPersistTaps="handled" scrollEventThrottle={props.scrollEventThrottle ?? 16} onScroll={event => { offsetY.current = event.nativeEvent.contentOffset.y; props.onScroll?.(event); }} onContentSizeChange={(width, height) => { props.onContentSizeChange?.(width, height); revealFocus(); }} onLayout={event => { props.onLayout?.(event); revealFocus(); }} /></FormFocusContext.Provider>;
});
FormScrollView.displayName = 'FormScrollView';
