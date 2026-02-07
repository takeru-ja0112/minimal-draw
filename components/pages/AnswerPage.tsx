"use client";

import { setStatusRoom } from "@/app/room/[id]/action";
import {
  addPointsToUser,
  checkAnswerRole,
  getThemePatternByRoomId,
  setdbAnswerInput,
  setdbAnswerResult,
} from "@/app/room/[id]/answer/action";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import AnswerCloseModal from "@/components/organisms/answer/AnswerCloseModal";
import FinalAnswerModal from "@/components/organisms/answer/FinalAnswerModal";
import PleaseCloseModal from "@/components/organisms/answer/PleaseCloseModal";
import useAnswerInputs from "@/hooks/useAnswerInputs";
import { useModalContext } from "@/hooks/useModalContext";
import usePushControl from "@/hooks/usePushControle";
import useStatus from "@/hooks/useStatus";
import { supabase } from "@/lib/supabase";
import { validateText } from "@/lib/validation";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IconContext } from "react-icons";
import {
  TbArrowBadgeLeftFilled,
  TbArrowBadgeRightFilled,
  TbArrowLeft,
  TbGhost2,
  TbLock,
  TbReload
} from "react-icons/tb";
import { Circle, Layer, Line, Rect, Stage } from "react-konva";
import ChallengeModal from "../organisms/answer/ChallengeModal";
import CorrectModal from "../organisms/answer/CorrectModal";
import FinishModal from "../organisms/answer/FinishModal";
import MistakeModal from "../organisms/answer/MistakeModal";
import StatusBar from "../organisms/StatusBat";

type Drawing = {
  id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  canvas_data: {
    lines: number[][];
    circles: Array<{ x: number; y: number; radius: number }>;
    rects: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
    }>;
  };
  element_count: number;
  created_at: string;
};

type AnswerPageProps = {
  roomId: string;
  drawings: Drawing[];
  initialTheme: ThemePattern | null;
  initialStatus: "WATING" | "DRAWING" | "ANSWERING" | "FINISHED" | "RESETTING";
};

interface ThemePattern {
  theme: string;
  furigana: string;
  kanji: string;
  katakana: string;
}

export default function AnswerPage({
  roomId,
  drawings,
  initialTheme,
}: AnswerPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isAnswerRole, setIsAnswerRole] = useState(false);
  const [data, setData] = useState<Drawing[]>(drawings);
  const currentDrawing = data[currentIndex];
  const { sub, handleSubscribe, handleDeleteSubscription } = usePushControl(roomId);
  const { status, currentTheme } = useStatus(roomId);
  const [themePattern, setThemePattern] = useState<ThemePattern>(
    initialTheme
      ? initialTheme
      : { theme: "", furigana: "", kanji: "", katakana: "" },
  );

  const [answerError, setAnswerError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mistake, setMistake] = useState<number>(0);
  const { open, close, modalType } = useModalContext();
  const [isNoti, setIsNoti] = useState<boolean>(sub ? true : false);

  const isBrowser = typeof window !== "undefined";

  // 回答者の内容を取得
  const { answerInputs, result } = useAnswerInputs(roomId);

  /**
   * プッシュ通知受信用
   */
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data.type === "push") {
          alert("Push受信: " + JSON.stringify(event.data.data));
          // setStateで画面に表示もOK
        }
      });
    }
  }, []);

  const handleNext = () => {
    if (currentIndex < data.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAnswer = async () => {
    const answerId = localStorage.getItem("drawing_app_user_id");
    const indexUserId = data[currentIndex]?.user_id;
    if (!isAnswerRole || !themePattern.theme || !answerId) return;

    if (status !== "ANSWERING" && status !== "FINISHED") {
      open("pleaseClose");
      return;
    }

    const result = isAnswerMatched(answer);
    if (result) {
      // 正解時の処理
      open("correct");
      setIsOpen(false);
      fire();
      setdbAnswerResult(roomId, "CORRECT");
      // ポイントを加算
      await addPointsToUser(roomId, answerId, 10);
      await addPointsToUser(roomId, indexUserId, 10); // 回答者にもポイントを加算
    } else {
      // 不正解時の処理
      if (mistake + 1 >= data.length) {
        open("challenge");
        setdbAnswerResult(roomId, "MISTAKE");
      } else {
        setMistake(currentIndex + 1);
        open("mistake");
        setdbAnswerResult(roomId, "MISTAKE");
      }
      setIsOpen(false);
    }
  };

  const isAnswerMatched = (userAnswer: string) => {
    if (userAnswer === null) return false;

    const formTheme = themePattern.theme.split("・").join("");
    const formFurigana = themePattern.furigana.split("・").join("");
    const formKanji = themePattern.kanji.split("・").join("");
    const formKatakana = themePattern.katakana.split("・").join("");

    if (userAnswer === formTheme) return true;
    if (userAnswer === formFurigana) return true;
    if (userAnswer === formKanji) return true;
    if (userAnswer === formKatakana) return true;

    return false;
  };

  const fire = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  /**
   * プッシュ通知用のデータをsupabaseに保存
   */
  const handleToggleSubscribe = async () => {
    /**
     * アプリから表示しているかどうか確認
     */

    const userId = localStorage.getItem("drawing_app_user_id");
    if (!userId) return;

    if (!isNoti) {
      console.log("subscribe");
      alert(`  ブラウザでは通知機能を利用できません。\n ホーム画面に追加してご利用ください。`);
      await handleSubscribe();
    } else {
      console.log("unsubscribe");
      await handleDeleteSubscription();
    }
  };

  useEffect(() => {
    if (result === "CORRECT") {
      fire();
    }
  }, [result]);

  const handleModify = () => {
    setStatusRoom(roomId, "DRAWING");
    setMistake(0);
    setCurrentIndex(0);
    close();
  };

  const handleReload = () => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("drawings")
        .select("*")
        .eq("room_id", roomId)
        .order("element_count", { ascending: true });
      setData(data || []);
    };
    fetchData();
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setAnswerError(null);
      if (isAnswerRole) {
        const result = await setdbAnswerInput(roomId, answer);
        if (!result.success) {
          setAnswerError("文字は30文字以内で入力してください");
        }
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [answer, isAnswerRole, roomId]);

  useEffect(() => {
    const fetchThemePattern = async () => {
      const themeResult = await getThemePatternByRoomId(roomId);
      if (themeResult.success && themeResult.data) {
        setThemePattern(themeResult.data);
      } else {
        console.error("Failed to fetch theme pattern:", themeResult.error);
      }
    };
    fetchThemePattern();
  }, [currentTheme, roomId]);

  useEffect(() => {
    const userId = localStorage.getItem("drawing_app_user_id");
    if (!userId) return;
    const fetchAnswerRole = async () => {
      const result = await checkAnswerRole(roomId, userId);
      if (result.success) {
        setIsAnswerRole(result.isAnswerRole);
      } else {
        console.error("Failed to check answer role:", result.error);
      }
    };
    fetchAnswerRole();
  }, [roomId]);

  useEffect(() => {
    // 初回データ取得
    const fetchData = async () => {
      const { data } = await supabase
        .from("drawings")
        .select("*")
        .eq("room_id", roomId)
        .order("element_count", { ascending: true });
      setData(data || []);
    };
    fetchData();

    const subscription = supabase
      .channel("public:drawings")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "drawings",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          console.log(sub);
          setCurrentIndex(0);
          setAnswer("");
          fetchData();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "drawings",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          setCurrentIndex(0);
          setAnswer("");
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [roomId]);

  return (
    <>
      {/* <BgObject /> */}
      <div className="flex flex-col items-center justify-center p-8">
        <Link
          href={`/room/${roomId}`}
          className="z-50 fixed top-13 left-2 text-gray-500 hover:text-gray-700 transition duration-300 p-2 rounded-full"
        >
          <TbArrowLeft size="2em" />
        </Link>
        {status !== "ANSWERING" && status !== "FINISHED" && isAnswerRole && (
          <Card className="max-w-lg w-full mt-6 mb-6 p-5 bg-yellow-50 border-dotted border-4 border-yellow-200">
            <h2 className="text-lg font-bold text-yellow-700">
              回答者のみ表示
            </h2>
            <p className="text-sm font-semibold text-yellow-600 mb-4">
              参加者のイラスト全てが届いたら締め切るボタンを押してください
            </p>
            <IconContext.Provider value={{ size: "1.5em" }}>
              <Button
                value="締め切る"
                icon={<TbLock />}
                onClick={() => open("answerClose")}
                className="text-yellow-800 hover:bg-yellow-100 transition-colors duration-300 w-full"
              />
            </IconContext.Provider>
          </Card>
        )}
        {/* ステータスエリア */}
        <StatusBar status={status}></StatusBar>
        {/* <AccessUser roomId={roomId} /> */}
        <Card className="max-w-lg w-full">
          {/* PWA用の通知許可コンポーネントのため一旦コメントアウト */}
          {isAnswerRole && (
            <div className="absolute left-3 top-3">
              <p className="text-xs text-gray-500 font-semibold">
                イラストを通知する
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  setIsNoti(!isNoti);
                  handleToggleSubscribe();
                }}
                animate={{ backgroundColor: isNoti ? "#fbbf24" : "#999999ff" }}
                className="relative w-11 h-6 bg-yellow-600 rounded-full cursor-pointer"
              >
                <motion.div
                  animate={isNoti ? { x: 20 } : { x: 0 }}
                  transition={{ type: "spring", stiffness: 700, damping: 30 }}
                  className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                ></motion.div>
              </motion.button>
            </div>
          )}
          <motion.button
            className="absolute right-3 top-3 justify-center flex-col items-end flex border-2 border-dotted border-green-700 rounded-full p-1 cursor-pointer hover:bg-green-100"
            initial={{ rotate: 0 }}
            whileTap={{ rotate: 360 }}
            onClick={handleReload}
          >
            {/* <p className="text-xs text-gray-500 font-semibold">イラストを更新する
            </p> */}
            {/* <motion.div
              initial={{ rotate: 0 }}
              whileTap={{ rotate: 360 }}
              transition={{ duration: 0.2 }}
            > */}
            <TbReload size={20} className="text-green-700" />
            {/* </motion.div> */}
          </motion.button>

          {data.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-500">
                まだ描画データがありません
              </p>
            </div>
          ) : (
            <>
              {/* 進捗表示 */}
              <div className="mb-6 text-center">
                <p className="text-lg font-semibold">
                  {currentIndex + 1} / {data.length} 人目
                </p>
                <p className="text-sm text-gray-500">
                  要素数: {currentDrawing?.element_count}
                </p>
                <p className="text-sm text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">
                  描いた人: {currentDrawing?.user_name}
                </p>
              </div>

              {/* キャンバス表示 */}
              <div className="flex justify-center mb-6">
                {!currentDrawing ? (
                  <div className="border-4 border-gray-300 rounded-lg overflow-hidden shadow-lg w-[300px] h-[300px] flex items-center justify-center bg-gray-100 animate-pulse">
                    <div className="w-2/3 h-2/3 bg-gray-300 rounded-lg" />
                    <p>読み込み中...</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <IconContext.Provider
                      value={{ size: "2em", color: "#808080" }}
                    >
                      <motion.button
                        initial={{ scale: 1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleBack}
                        disabled={currentIndex === 0}
                        className="disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <TbArrowBadgeLeftFilled />
                      </motion.button>
                      <div className="border-4 border-gray-300 w-[300px] h-[300px] relative rounded-lg overflow-hidden shadow-lg">
                        {/* レースカーテンのような表現 */}
                        <button
                          onClick={() => {
                            if (status !== "ANSWERING" && status !== "FINISHED")
                              open("pleaseClose");
                            else setIsOpen(!isOpen);
                          }}
                          className="absolute top-0 left-0 w-full h-full z-20 cursor-pointer"
                        >
                          <div className="w-full h-full flex absolute top-0 z-10">
                            <motion.div
                              initial={{ left: 0 }}
                              animate={
                                isOpen ? { left: "-100%" } : { left: "0" }
                              }
                              transition={
                                isOpen
                                  ? { duration: 3, ease: "easeInOut" }
                                  : undefined
                              }
                              className="absolute w-1/2 h-full bg-yellow-500 rounded-br-[30%]"
                            />
                            <motion.div
                              initial={{ right: 0 }}
                              animate={
                                isOpen ? { right: "-100%" } : { right: "0" }
                              }
                              transition={
                                isOpen
                                  ? { duration: 3, ease: "easeInOut" }
                                  : undefined
                              }
                              className="absolute w-1/2 h-full bg-yellow-500 rounded-bl-[30%]"
                            />
                          </div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2  z-11">
                            <motion.h1
                              initial={{ opacity: 1 }}
                              animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
                              transition={isOpen ? { duration: 1 } : undefined}
                              className="font-bold text-4xl text-white"
                            >
                              ひらく
                            </motion.h1>
                          </div>
                        </button>
                        <Stage width={300} height={300}>
                          <Layer>
                            {currentDrawing.canvas_data.lines.map((line, i) => (
                              <Line
                                key={`line-${i}`}
                                points={line}
                                stroke="black"
                                strokeWidth={3}
                              />
                            ))}
                            {currentDrawing.canvas_data.circles.map(
                              (circle, i) => (
                                <Circle
                                  key={`circle-${i}`}
                                  x={circle.x}
                                  y={circle.y}
                                  radius={circle.radius}
                                  stroke="black"
                                  strokeWidth={3}
                                />
                              ),
                            )}
                            {currentDrawing.canvas_data.rects.map((rect, i) => (
                              <Rect
                                key={`rect-${i}`}
                                x={rect.x}
                                y={rect.y}
                                width={rect.width}
                                height={rect.height}
                                stroke="black"
                                strokeWidth={3}
                              />
                            ))}
                          </Layer>
                        </Stage>
                      </div>
                      <button
                        onClick={() => {
                          if (isAnswerRole && currentIndex >= mistake) return;
                          handleNext();
                        }}
                        className="disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={
                          isAnswerRole
                            ? currentIndex >= mistake
                            : currentIndex === data.length - 1
                        }
                      >
                        <TbArrowBadgeRightFilled />
                      </button>
                    </IconContext.Provider>
                  </div>
                )}
              </div>

              {/* 回答入力 */}
              {isAnswerRole && (
                <div className="mb-6">
                  <Input
                    type="text"
                    value={answer}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const isValid = validateText(e.target.value).success;
                      if (isValid) {
                        setAnswer(e.target.value);
                      }
                    }}
                    placeholder="答えを入力してください"
                    className="w-full "
                    disabled={status !== "ANSWERING"}
                  />
                  {answerError && (
                    <p className="text-red-500 text-sm font-semibold mt-1">
                      {answerError}
                    </p>
                  )}
                  <p className="text-gray-400 text-sm">
                    ひらがな、カタカナ、漢字のいずれでも構いません。
                  </p>
                </div>
              )}

              {/* ナビゲーションボタン */}
              <div className="flex justify-between gap-4">
                {isAnswerRole && (
                  <>
                    <Button
                      value="回答する"
                      onClick={() => open("finalAnswer")}
                      disabled={!isAnswerRole || status !== "ANSWERING"}
                      className="w-80 mx-auto"
                    />
                  </>
                )}
              </div>
              {!isAnswerRole && (
                <>
                  <Card className="mt-6 rounded-xl">
                    <h1 className="text-center font-bold">回答</h1>
                    <hr className="my-2 text-gray-300" />
                    <div className="flex justify-center items-center min-h-[40px]">
                      <motion.h1
                        key={answerInputs}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          ease: "easeOut",
                          type: "spring",
                          bounce: 0.5,
                        }}
                        className={`whitespace-nowrap overflow-y-auto  font-bold text-3xl text-center ${result === "CORRECT" ? "text-green-500" : result === "MISTAKE" ? "text-red-500" : "text-gray-700"}`}
                      >
                        {answerInputs ? (
                          answerInputs
                        ) : (
                          <>
                            <div className="flex items-center text-gray-400 animate-pulse">
                              <TbGhost2 className="mr-2 " />
                              <span className="block text-xl">
                                回答者の記入がまだだよ！
                              </span>
                            </div>
                          </>
                        )}
                      </motion.h1>
                    </div>
                  </Card>
                </>
              )}
            </>
          )}
        </Card>
        {modalType === "finalAnswer" && (
          <FinalAnswerModal handleAnswer={handleAnswer} />
        )}
        {modalType === "answerClose" && isAnswerRole && (
          <AnswerCloseModal roomId={roomId} dataLength={data.length} />
        )}
        {modalType === "correct" && <CorrectModal />}
        {modalType === "mistake" && (
          <MistakeModal roomId={roomId} onClick={() => handleNext()} />
        )}
        {modalType === "challenge" && (
          <ChallengeModal
            roomId={roomId}
            onModify={handleModify}
            setIsAnswerRole={setIsAnswerRole}
          />
        )}
        {modalType === "pleaseClose" && <PleaseCloseModal />}
        {modalType === "finish" && (
          <FinishModal
            roomId={roomId}
            setIsAnswerRole={setIsAnswerRole}
          ></FinishModal>
        )}
      </div>
    </>
  );
}
