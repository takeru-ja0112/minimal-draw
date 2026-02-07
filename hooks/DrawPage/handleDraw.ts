'use client';

import { getInfoRoom } from '@/app/room/[id]/action';
import { saveDrawing } from '@/app/room/[id]/drawing/action';
import { getOrCreateUser, getUsername } from '@/lib/user';
import { KonvaEventObject } from 'konva/lib/Node';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export default function useDraw(roomId: string) {
  const canvasData =
    typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem(`drawing_${roomId}`) || 'null') : null;
  const [count, setCount] = useState<number>(canvasData ? canvasData.element : 0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [userName] = useState<string>(getUsername() || getOrCreateUser().username);
  const historyStep = useRef(0);
  const isDrawing = useRef(false);
  const [lines, setLines] = useState<number[][]>(canvasData?.lines || []);
  const [circles, setCircles] = useState<
    Array<{
      x: number;
      y: number;
      radius: number;
    }>
  >(canvasData?.circles || []);
  const [rects, setRects] = useState<
    Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
    }>
  >(canvasData?.rects || []);
  const linesHistory = useRef<Array<number[][]>>([[...lines]]);
  const circlesHistory = useRef<
    Array<
      Array<{
        x: number;
        y: number;
        radius: number;
      }>
    >
  >([[...circles]]);
  const rectsHistory = useRef<
    Array<
      Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
      }>
    >
  >([[...rects]]);
  const router = useRouter();
  const lastEventType = useRef<string | null>(null);

  // デバウンス用タイマーref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [tool, setTool] = useState<'line' | 'circle' | 'rect' | 'eraser' | 'move'>('line');

  const w = 300;
  const h = 300;

  const ERASER_RADIUS = 12;
  const STROKE_WIDTH = 3;
  const MOVE_SELECT_THRESHOLD = 10;

  const [selectedShape, setSelectedShape] = useState<{
    type: 'line' | 'circle' | 'rect';
    index: number;
  } | null>(null);
  const selectedShapeRef = useRef<{
    type: 'line' | 'circle' | 'rect';
    index: number;
  } | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const movedDuringMoveRef = useRef(false);

  const distanceToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) {
      return Math.hypot(px - x1, py - y1);
    }
    const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
    const clamped = Math.max(0, Math.min(1, t));
    const closestX = x1 + clamped * dx;
    const closestY = y1 + clamped * dy;
    return Math.hypot(px - closestX, py - closestY);
  };

  const pushHistory = (
    nextLines: number[][],
    nextCircles: Array<{ x: number; y: number; radius: number }>,
    nextRects: Array<{ x: number; y: number; width: number; height: number; rotation: number }>,
  ) => {
    const newLinesHistory = linesHistory.current.slice(0, historyStep.current + 1);
    const newCirclesHistory = circlesHistory.current.slice(0, historyStep.current + 1);
    const newRectsHistory = rectsHistory.current.slice(0, historyStep.current + 1);

    newLinesHistory.push([...nextLines]);
    newCirclesHistory.push([...nextCircles]);
    newRectsHistory.push([...nextRects]);

    linesHistory.current = newLinesHistory;
    circlesHistory.current = newCirclesHistory;
    rectsHistory.current = newRectsHistory;
    historyStep.current = newLinesHistory.length - 1;

    setLines(nextLines);
    setCircles(nextCircles);
    setRects(nextRects);
    setCount(nextLines.length + nextCircles.length + nextRects.length);
  };

  const eraseAtPoint = (x: number, y: number) => {
    const threshold = ERASER_RADIUS + STROKE_WIDTH;
    let best: {
      type: 'line' | 'circle' | 'rect';
      index: number;
      distance: number;
    } | null = null;

    // rects: 距離を算出
    for (let i = 0; i < rects.length; i += 1) {
      const rect = rects[i];
      const left = Math.min(rect.x, rect.x + rect.width);
      const right = Math.max(rect.x, rect.x + rect.width);
      const top = Math.min(rect.y, rect.y + rect.height);
      const bottom = Math.max(rect.y, rect.y + rect.height);

      const isInside = x >= left && x <= right && y >= top && y <= bottom;

      const dx = Math.max(left - x, 0, x - right);
      const dy = Math.max(top - y, 0, y - bottom);
      const outsideDistance = Math.hypot(dx, dy);

      const insideDistance = isInside ? Math.min(x - left, right - x, y - top, bottom - y) : Number.POSITIVE_INFINITY;

      const d = isInside ? insideDistance : outsideDistance;
      if (d <= threshold && (!best || d < best.distance)) {
        best = { type: 'rect', index: i, distance: d };
      }
    }

    // circles: 距離を算出
    for (let i = 0; i < circles.length; i += 1) {
      const circle = circles[i];
      const centerDistance = Math.hypot(x - circle.x, y - circle.y);
      const d = Math.abs(centerDistance - circle.radius);
      if (d <= threshold && (!best || d < best.distance)) {
        best = { type: 'circle', index: i, distance: d };
      }
    }

    // lines: 距離を算出
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const d = distanceToSegment(x, y, line[0], line[1], line[2], line[3]);
      if (d <= threshold && (!best || d < best.distance)) {
        best = { type: 'line', index: i, distance: d };
      }
    }

    if (!best) return false;

    if (best.type === 'rect') {
      const nextRects = rects.filter((_, idx) => idx !== best.index);
      pushHistory(lines, circles, nextRects);
      return true;
    }

    if (best.type === 'circle') {
      const nextCircles = circles.filter((_, idx) => idx !== best.index);
      pushHistory(lines, nextCircles, rects);
      return true;
    }

    const nextLines = lines.filter((_, idx) => idx !== best.index);
    pushHistory(nextLines, circles, rects);
    return true;
  };

  const getNearestShape = (x: number, y: number) => {
    let best: {
      type: 'line' | 'circle' | 'rect';
      index: number;
      distance: number;
    } | null = null;

    for (let i = 0; i < rects.length; i += 1) {
      const rect = rects[i];
      const left = Math.min(rect.x, rect.x + rect.width);
      const right = Math.max(rect.x, rect.x + rect.width);
      const top = Math.min(rect.y, rect.y + rect.height);
      const bottom = Math.max(rect.y, rect.y + rect.height);

      const isInside = x >= left && x <= right && y >= top && y <= bottom;
      if (!isInside) {
        const dx = Math.max(left - x, 0, x - right);
        const dy = Math.max(top - y, 0, y - bottom);
        const d = Math.hypot(dx, dy);
        if (!best || d < best.distance) {
          best = { type: 'rect', index: i, distance: d };
        }
        continue;
      }

      const distanceToBorder = Math.min(x - left, right - x, y - top, bottom - y);
      if (!best || distanceToBorder < best.distance) {
        best = { type: 'rect', index: i, distance: distanceToBorder };
      }
    }

    for (let i = 0; i < circles.length; i += 1) {
      const circle = circles[i];
      const centerDistance = Math.hypot(x - circle.x, y - circle.y);
      const d = Math.abs(centerDistance - circle.radius);
      if (!best || d < best.distance) {
        best = { type: 'circle', index: i, distance: d };
      }
    }

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const d = distanceToSegment(x, y, line[0], line[1], line[2], line[3]);
      if (!best || d < best.distance) {
        best = { type: 'line', index: i, distance: d };
      }
    }

    if (!best || best.distance > MOVE_SELECT_THRESHOLD + STROKE_WIDTH) {
      return null;
    }

    return { type: best.type, index: best.index };
  };

  const handleMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (lastEventType.current === e.evt.type) return;
    lastEventType.current = e.evt.type;

    const point = e.target.getStage()?.getPointerPosition();
    setSelectedShape(null);
    selectedShapeRef.current = null;
    isDrawing.current = true;
    if (!point) return;

    if (tool === 'line') {
      // 直線の開始点と終了点（最初は同じ点）
      setLines((prev) => [...prev, [point.x, point.y, point.x, point.y]]);
    } else if (tool === 'circle') {
      setCircles((prev) => [
        ...prev,
        {
          x: point.x,
          y: point.y,
          radius: 0,
        },
      ]);
    } else if (tool === 'rect') {
      setRects((prev) => [
        ...prev,
        {
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
          rotation: 0,
        },
      ]);
    } else if (tool === 'eraser') {
      // 消しゴムは近くの図形を削除
      isDrawing.current = false;
      eraseAtPoint(point.x, point.y);
    } else if (tool === 'move') {
      const nearest = getNearestShape(point.x, point.y);
      selectedShapeRef.current = nearest;
      lastPointerRef.current = { x: point.x, y: point.y };
      setSelectedShape(nearest);
      isDrawing.current = !!nearest;
      movedDuringMoveRef.current = false;
    }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (isDrawing.current === false) return;

    const point = e.target.getStage()?.getPointerPosition();
    if (!point) return;

    if (tool === 'move') {
      const selected = selectedShapeRef.current;
      const last = lastPointerRef.current;
      if (!selected || !last) return;
      const dx = point.x - last.x;
      const dy = point.y - last.y;
      if (dx === 0 && dy === 0) return;
      movedDuringMoveRef.current = true;

      if (selected.type === 'line') {
        setLines((prev) =>
          prev.map((line, idx) =>
            idx === selected.index ? [line[0] + dx, line[1] + dy, line[2] + dx, line[3] + dy] : line,
          ),
        );
      } else if (selected.type === 'circle') {
        setCircles((prev) =>
          prev.map((circle, idx) =>
            idx === selected.index ? { ...circle, x: circle.x + dx, y: circle.y + dy } : circle,
          ),
        );
      } else if (selected.type === 'rect') {
        setRects((prev) =>
          prev.map((rect, idx) => (idx === selected.index ? { ...rect, x: rect.x + dx, y: rect.y + dy } : rect)),
        );
      }

      lastPointerRef.current = { x: point.x, y: point.y };
      return;
    }

    if (tool === 'line') {
      const lastIdx = lines.length - 1;
      // 直線の終了点のみを更新（開始点はそのまま）
      const startX = lines[lastIdx][0];
      const startY = lines[lastIdx][1];
      setLines((prev) => [...prev.slice(0, lastIdx), [startX, startY, point.x, point.y]]);
    } else if (tool === 'circle') {
      const lastCircleIdx = circles.length - 1;
      const radius = Math.hypot(point.x - circles[lastCircleIdx].x, point.y - circles[lastCircleIdx].y);
      setCircles((prev) => [
        ...prev.slice(0, lastCircleIdx),
        {
          ...circles[lastCircleIdx],
          radius,
        },
      ]);
    } else if (tool === 'rect') {
      const lastRectIdx = rects.length - 1;
      const rect = rects[lastRectIdx];
      const dx = point.x - rect.x;
      const dy = point.y - rect.y;
      const width = dx;
      const height = dy;
      // const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
      setRects((prev) => [
        ...prev.slice(0, lastRectIdx),
        {
          ...rect,
          width,
          height,
          rotation: 0,
        },
      ]);
    }
  };

  const handleMouseUp = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (lastEventType.current === e.evt.type) return;
    lastEventType.current = e.evt.type;

    if (tool === 'eraser') {
      return;
    }

    if (tool === 'move') {
      setSelectedShape(null);
      selectedShapeRef.current = null;
      lastPointerRef.current = null;
      isDrawing.current = false;

      if (movedDuringMoveRef.current) {
        const newLinesHistory = linesHistory.current.slice(0, historyStep.current + 1);
        const newCirclesHistory = circlesHistory.current.slice(0, historyStep.current + 1);
        const newRectsHistory = rectsHistory.current.slice(0, historyStep.current + 1);

        newLinesHistory.push([...lines]);
        newCirclesHistory.push([...circles]);
        newRectsHistory.push([...rects]);

        linesHistory.current = newLinesHistory;
        circlesHistory.current = newCirclesHistory;
        rectsHistory.current = newRectsHistory;
        historyStep.current = newLinesHistory.length - 1;
      }
      movedDuringMoveRef.current = false;
      return;
    }

    setCount((prev) => prev + 1);
    isDrawing.current = false;

    const newLinesHistory = linesHistory.current.slice(0, historyStep.current + 1);
    const newCirclesHistory = circlesHistory.current.slice(0, historyStep.current + 1);
    const newRectsHistory = rectsHistory.current.slice(0, historyStep.current + 1);

    newLinesHistory.push([...lines]);
    newCirclesHistory.push([...circles]);
    newRectsHistory.push([...rects]);

    linesHistory.current = newLinesHistory;
    circlesHistory.current = newCirclesHistory;
    rectsHistory.current = newRectsHistory;
    historyStep.current = newLinesHistory.length - 1;
  };
  // デバウンス保存処理
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }
  saveTimeoutRef.current = setTimeout(() => {
    saveToSessionStorage();
  }, 500); // 0.5秒後に保存

  // 初期読み込みしてから履歴も更新する
  const handleInitializeHistory = () => {
    linesHistory.current = [[...lines]];
    circlesHistory.current = [[...circles]];
    rectsHistory.current = [[...rects]];
    historyStep.current = 0;
  };

  const handleUndo = () => {
    // if (historyStep.current === 0) return;
    if (historyStep.current === 0) return;
    // setCount((prev) => prev - 1);

    historyStep.current -= 1;
    const previousLines = linesHistory.current[historyStep.current];
    const previousCircles = circlesHistory.current[historyStep.current];
    const previousRects = rectsHistory.current[historyStep.current];
    setLines(previousLines);
    setCircles(previousCircles);
    setRects(previousRects);
    setCount(previousCircles.length + previousLines.length + previousRects.length);
  };

  const handleRedo = () => {
    if (historyStep.current === linesHistory.current.length - 1) return;
    setCount((prev) => prev + 1);

    historyStep.current += 1;
    const nextLines = linesHistory.current[historyStep.current];
    const nextCircles = circlesHistory.current[historyStep.current];
    const nextRects = rectsHistory.current[historyStep.current];
    setLines(nextLines);
    setCircles(nextCircles);
    setRects(nextRects);
    setCount(nextCircles.length + nextLines.length + nextRects.length);
  };

  const handleReset = () => {
    if (count === 0) return;
    setCount(0);
    historyStep.current += 1;
    const resetLines: any = [];
    const resetCircles: any = [];
    const resetRects: any = [];
    linesHistory.current.push(resetLines);
    circlesHistory.current.push(resetCircles);
    rectsHistory.current.push(resetRects);
    setLines(resetLines);
    setCircles(resetCircles);
    setRects(resetRects);
  };

  /**
   * 描画データをDBに保存する
   *
   * @returns
   */
  const handleSave = async () => {
    const info = await getInfoRoom(roomId);
    if (!info.success) return setSaveMessage('データの保存に失敗しました');
    const theme = info.data?.current_theme || '';
    setIsSaving(true);
    setSaveMessage('');

    try {
      // ユーザー情報を取得
      const user = getOrCreateUser();

      const canvasData = {
        lines,
        circles,
        rects,
      };

      const result = await saveDrawing(roomId, user.id, canvasData, userName, theme);

      if (result.success) {
        router.push(`/room/${roomId}/answer`);
      } else {
        setSaveMessage(`保存失敗: ${result.error}`);
      }
    } catch (error) {
      setSaveMessage(`エラー: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * セッションストレージに描画データを保存する
   */
  const saveToSessionStorage = () => {
    const canvasData = {
      lines: linesHistory.current[historyStep.current],
      circles: circlesHistory.current[historyStep.current],
      rects: rectsHistory.current[historyStep.current],
      element: lines.length + circles.length + rects.length,
    };
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(`drawing_${roomId}`, JSON.stringify(canvasData));
    }
  };

  return {
    count,
    isSaving,
    saveMessage,
    userName,
    lines,
    circles,
    rects,
    selectedShape,
    tool,
    setTool,
    setCount,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleInitializeHistory,
    handleUndo,
    handleRedo,
    handleReset,
    handleSave,
    saveToSessionStorage,
    w,
    h,
  };
}
