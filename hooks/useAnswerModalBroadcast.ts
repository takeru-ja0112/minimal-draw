import { supabase } from '@/lib/supabase';
import { useEffect, useRef, useState } from 'react';

type UseAnswerModalBroadcastParams = {
  roomId: string;
  isAnswerRole: boolean;
  modalType: string | null;
};

type ModalStatePayload = {
  isOpen: boolean;
};

export default function useAnswerModalBroadcast({
  roomId,
  isAnswerRole,
  modalType,
}: UseAnswerModalBroadcastParams) {
  const [answererOperation, setAnswererOperation] = useState({ roomId, isOpen: false });
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isSubscribedRef = useRef(false);
  const isAnswerRoleRef = useRef(isAnswerRole);
  const modalTypeRef = useRef(modalType);

  useEffect(() => {
    isAnswerRoleRef.current = isAnswerRole;
    modalTypeRef.current = modalType;
  }, [isAnswerRole, modalType]);

  useEffect(() => {
    const channel = supabase
      .channel(`answer-modal:${roomId}`)
      .on('broadcast', { event: 'modal-state' }, ({ payload }) => {
        const modalState = payload as Partial<ModalStatePayload>;
        if (typeof modalState.isOpen === 'boolean') {
          setAnswererOperation({ roomId, isOpen: modalState.isOpen });
        }
      })
      .subscribe((status) => {
        isSubscribedRef.current = status === 'SUBSCRIBED';

        if (status === 'SUBSCRIBED' && isAnswerRoleRef.current) {
          void channel.send({
            type: 'broadcast',
            event: 'modal-state',
            payload: { isOpen: modalTypeRef.current !== null } satisfies ModalStatePayload,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      isSubscribedRef.current = false;

      if (isAnswerRoleRef.current) {
        void channel
          .send({
            type: 'broadcast',
            event: 'modal-state',
            payload: { isOpen: false } satisfies ModalStatePayload,
          })
          .finally(() => supabase.removeChannel(channel));
        return;
      }

      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || !isSubscribedRef.current) return;

    void channel.send({
      type: 'broadcast',
      event: 'modal-state',
      payload: {
        isOpen: isAnswerRole && modalType !== null,
      } satisfies ModalStatePayload,
    });
  }, [isAnswerRole, modalType]);

  return {
    isAnswererOperating: answererOperation.roomId === roomId && answererOperation.isOpen,
  };
}
