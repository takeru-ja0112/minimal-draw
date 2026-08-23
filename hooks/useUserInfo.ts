'use client';

import { getUserInfo } from '@/app/user/action';
import { useEffect, useState } from 'react';

export type UserInfoData = {
  username: string | null;
  icon_name: string | null;
  icon_color: string | null;
};

/**
 * ユーザーIDから表示名・アイコン情報を取得するフック
 *
 * userIdがnull/undefinedの場合、またはユーザーが未登録の場合はnullを返す
 */
export default function useUserInfo(userId: string | null | undefined) {
  const [userInfo, setUserInfo] = useState<UserInfoData | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchUserInfo = async () => {
      if (!userId) {
        if (!isCancelled) setUserInfo(null);
        return;
      }

      const result = await getUserInfo(userId);
      if (!isCancelled) {
        setUserInfo(result.success && result.data ? result.data : null);
      }
    };

    fetchUserInfo();

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  return userInfo;
}
