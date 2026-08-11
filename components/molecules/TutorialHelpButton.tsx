import { TbQuestionMark } from 'react-icons/tb';
import { resetTutorial } from '@/hooks/tutorial/useTutorial';

export default function TutorialHelpButton({
  tutorialKey,
  id,
  className,
}: { tutorialKey: string; id: string; className?: string }) {
  return (
    <button
      id={id}
      className={`flex text-sm border border-3 rounded-full p-1 hover:bg-gray-200 bg-white/70 ${className ?? ''}`}
      onClick={() => resetTutorial(tutorialKey)}
    >
      <TbQuestionMark className="text-xl" />
    </button>
  );
}
