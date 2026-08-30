'use client';

import { useEffect, useState, useRef } from 'react';

export type ScrollDirection = 'up' | 'down' | null;

export interface ScrollClassOptions {
  /** 上スクロール時に適用する className */
  up?: string;
  /** 下スクロール時に適用する className */
  down?: string;
  /** ページの最上部付近にいるときに適用する className */
  top?: string;
  /** 一定以上スクロールされた場合に常に適用する className */
  scrolled?: string;
}

export interface UseScrollDirectionOptions {
  /** スクロール方向を変化させると判定する最小スクロール移動量 (px) [デフォルト: 10] */
  threshold?: number;
  /** ページ最上部（top）と判定する Y 座標の位置 (px) [デフォルト: 0] */
  topThreshold?: number;
  /** 初期スクロール方向 [デフォルト: null] */
  initialDirection?: ScrollDirection;
  /** スクロール状態に応じて自動付与・切り替える className の設定 */
  classes?: ScrollClassOptions;
  /** 監視対象のスクロール要素 (指定しない場合は window を監視) */
  targetRef?: React.RefObject<HTMLElement | null>;
}

export interface ScrollDirectionResult {
  /** 現在のスクロール方向 ('up' | 'down' | null) */
  scrollDirection: ScrollDirection;
  /** 上スクロール中かどうか */
  isUp: boolean;
  /** 下スクロール中かどうか */
  isDown: boolean;
  /** 最上部付近に位置しているか */
  isTop: boolean;
  /** topThreshold を超えてスクロールされているか */
  isScrolled: boolean;
  /** 現在のスクロール Y 座標 */
  scrollY: number;
  /** 設定された classes オプションに基づく統合 className 文字列 */
  scrollClass: string;
}

/**
 * 画面または特定のスクロール要素のスクロール方向（上・下）や最上部判定を監視し、
 * それに応じた className や状態を取得するカスタムフック
 */
export function useScrollDirection(
  options: UseScrollDirectionOptions = {}
): ScrollDirectionResult {
  const {
    threshold = 10,
    topThreshold = 0,
    initialDirection = null,
    classes,
    targetRef,
  } = options;

  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(initialDirection);
  const [scrollY, setScrollY] = useState<number>(0);
  const [isTop, setIsTop] = useState<boolean>(true);
  const prevScrollY = useRef<number>(0);
  const ticking = useRef<boolean>(false);

  useEffect(() => {
    const getScrollY = (): number => {
      if (targetRef && targetRef.current) {
        return targetRef.current.scrollTop;
      }
      return typeof window !== 'undefined' ? window.scrollY : 0;
    };

    const initialY = getScrollY();
    prevScrollY.current = initialY;
    setScrollY(initialY);
    setIsTop(initialY <= topThreshold);

    const updateScrollDir = () => {
      const currentScrollY = getScrollY();
      const diff = currentScrollY - prevScrollY.current;

      // ページの最上部かチェック
      const currentIsTop = currentScrollY <= topThreshold;
      setIsTop(currentIsTop);
      setScrollY(currentScrollY);

      // バウンス防止（iOSなどでマイナスや最大スクロール幅を超えた場合）
      if (currentScrollY < 0) {
        ticking.current = false;
        return;
      }

      // 閾値（threshold）を超える移動があった場合のみ方向を判定
      if (Math.abs(diff) >= threshold) {
        const newDirection: ScrollDirection = diff > 0 ? 'down' : 'up';
        setScrollDirection(newDirection);
        prevScrollY.current = currentScrollY;
      }

      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDir);
        ticking.current = true;
      }
    };

    const targetElement = targetRef?.current || window;
    targetElement.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      targetElement.removeEventListener('scroll', onScroll);
    };
  }, [threshold, topThreshold, targetRef]);

  const isUp = scrollDirection === 'up';
  const isDown = scrollDirection === 'down';
  const isScrolled = !isTop;

  // classes オプションが設定されている場合、対応する className を生成
  const computedClasses: string[] = [];
  if (classes) {
    if (isTop && classes.top) {
      computedClasses.push(classes.top);
    }
    if (isScrolled && classes.scrolled) {
      computedClasses.push(classes.scrolled);
    }
    if (isUp && classes.up) {
      computedClasses.push(classes.up);
    }
    if (isDown && classes.down) {
      computedClasses.push(classes.down);
    }
  }

  const scrollClass = computedClasses.join(' ');

  return {
    scrollDirection,
    isUp,
    isDown,
    isTop,
    isScrolled,
    scrollY,
    scrollClass,
  };
}
