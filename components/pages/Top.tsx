"use client";

import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import NoLimitPeople from "@/components/molecules/illust/top/NoLimitPeople ";
import WhatsMinimal from "@/components/molecules/illust/top/WhatsMinimal";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/atoms/Input";
import SetUserModal from "@/components/organisms/lobby/SetUserModal";
import RoomSearchSection from "@/components/organisms/top/RoomSearchSection";
import { getUsername, getUserId, setUsernameSchema } from "@/lib/user";
import historyLocalRoom from "@/lib/hitoryLocalRoom";
import { ensureUser } from "@/app/user/action";
import { Schoolbell } from "next/font/google";

const schoolbell = Schoolbell({
    subsets: ["latin"],
    weight: "400",
    display: 'swap',
});


export default function Top() {
    const title = "Minimal Drawer";

    const username = getUsername();
    const [user, setUser] = useState(username || "");
    const [nameError, setNameError] = useState("");
    const [isSetUserModal, setIsSetUserModal] = useState(!username);
    const userId = getUserId() || "";
    const router = useRouter();

    // スクロール出現用ref
    const [ref1, inView1] = useInView({ triggerOnce: true, threshold: 0.2 });
    const [ref2, inView2] = useInView({ triggerOnce: true, threshold: 0.2 });
    const [ref3, inView3] = useInView({ triggerOnce: true, threshold: 0.2 });

    return (
        <>
            <div
                className="min-w-[320px] flex items-center justify-center px-8 overflow-hidden"
            >

                <div className="max-w-2xl w-90 mt-20 mb-30 z-10">
                    {/* メインコンテンツ */}
                    <motion.div
                        className="text-center mb-12 flex flex-col items-center justify-center"
                    // style={{ perspective: "1000px" }}
                    >
                        <motion.div
                            className="mb-6"
                            initial={{}}
                            whileHover={{ rotateZ: -10 }}
                            transition={{ duration: 0.1, ease: "easeInOut" }}
                        >
                            <Image src="/minimalDrawIcon.svg" alt="Logo" width={120} height={120} />
                        </motion.div>
                        {/* タイトル - 3D効果 */}
                        <motion.h1
                            className={`${schoolbell.className} text-6xl font-bold`}
                        >
                            {title}
                        </motion.h1>
                    </motion.div>

                    {/* ユーザー名の管理 */}
                    <Card className="mb-6">
                        <div className="mb-2">
                            <label htmlFor="username" className="font-semibold text-gray-700">
                                名前
                            </label>
                        </div>
                        <div className="my-2">
                            <Input
                                name="username"
                                value={user}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setUsernameSchema({
                                        name: e.target.value,
                                        setNameError,
                                        setUser,
                                    });
                                }}
                                onBlur={() => {
                                    setNameError("");
                                    if (!user) {
                                        setNameError("ユーザー名は必須です");
                                        return;
                                    }
                                    if (userId) {
                                        void ensureUser(userId, user);
                                    }
                                }}
                                placeholder="ユーザー名を入力してください"
                                className={`w-full ${nameError ? "border-red-500 border-2" : ""}`}
                            />
                        </div>
                        {nameError && (
                            <div className="mb-2">
                                <p className="text-red-500 font-semibold text-sm">
                                    {nameError}
                                </p>
                            </div>
                        )}
                    </Card>


                    {/* ルーム検索セクション */}
                    <RoomSearchSection user={user} userId={userId} setNameError={setNameError} />
                    {/* ボタンエリア */}
                    <motion.div
                        className="space-y-4 mb-6"
                    >
                        <div className="mb-2">
                            {/* メインボタン */}
                            <Link href="/drawing">
                                <Button value="描いてみる" className="text-xl w-full" />
                            </Link>
                        </div>
                    </motion.div>

                    <div className="mt-30 text-center text-2xl mb-6">
                        <h2 className="font-bold">{title}ってなに？</h2>
                    </div>
                    <motion.div
                        ref={ref1}
                        initial={{ opacity: 0, y: 40 }}
                        animate={inView1 ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                    >
                        <Card className="text-center">
                            {/* イメージ */}
                            <WhatsMinimal />
                            <h2 className="text-xl text-gray-700 font-semibold mb-2">お題をシンプルに表現！</h2>
                            <p className="text-gray-600">
                                {title}は出題されたお題を、直線、正円、長方形を使って表現するシンプルなゲーム！
                                <br />
                            </p>
                        </Card>
                    </motion.div>
                    <motion.div
                        ref={ref2}
                        initial={{ opacity: 0, y: 40 }}
                        animate={inView2 ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                    >
                        <Card className="mt-10 text-center">
                            {/* イメージ */}
                            <NoLimitPeople />
                            <h2 className="text-xl text-gray-700 font-semibold mb-2">2人以上で遊べる！</h2>
                            <p className="text-gray-600">
                                このゲームでは描く人と答える人で分かれます。描く人は何人でも参加可能！
                                <br />
                                3〜5人で遊ぶのがおすすめ！
                            </p>
                        </Card>
                    </motion.div>
                    <motion.div
                        ref={ref3}
                        initial={{ opacity: 0, y: 40 }}
                        animate={inView3 ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                    >
                        <Card className="mt-10 text-center">
                            {/* イメージ */}
                            <div className="my-4">
                                <h2 className="text-4xl font-bold text-yellow-500">Lets Play!</h2>
                            </div>
                            <h2 className="text-xl text-gray-700 font-semibold mb-2">登録なしですぐに遊べる！</h2>
                            <p className="text-gray-600">
                                このゲームはアカウントログイン不要の完全無料で遊ぶ事ができます！
                            </p>
                        </Card>
                    </motion.div>
                    <div className="mt-10">
                        {/* メインボタン */}
                        <Link href="/lobby">
                            <Button value="みんなで遊ぶ" className="text-xl w-full" />
                        </Link>
                    </div>
                </div>
            </div>

            {isSetUserModal && (
                <SetUserModal
                    isSetUserModal={isSetUserModal}
                    user={user}
                    nameError={nameError}
                    loading={false}
                    setUser={setUser}
                    setNameError={setNameError}
                    setIsSetUserModal={setIsSetUserModal}
                    className="w-full"
                />
            )}
        </>
    );
}