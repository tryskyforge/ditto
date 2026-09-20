import { useEffect } from 'react';
import { useFullview } from '@/stores/fullview';
import { TooltipProvider } from '@/ui/components/ui/tooltip';
import UpdateNotice from '@/ui/shared/UpdateNotice';
import { STEP_RAIL_MIN_STEPS } from './components/GuideStepRail';
import VoiceNotice from './components/VoiceNotice';
import GuideContent from './GuideContent';
import LibraryContent from './LibraryContent';
import { useRoute } from './router';
import SearchModal from './SearchModal';
import TopNav from './TopNav';

export default function FullViewApp() {
  const route = useRoute();
  const { toggleSearch, historyOpen, guideStepCount } = useFullview((s) => ({
    toggleSearch: s.toggleSearch,
    historyOpen: s.historyOpen,
    guideStepCount: s.guideStepCount,
  }));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSearch]);

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <TopNav route={route} />
        <SearchModal />
        <UpdateNotice className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50" />

        {route.page === 'library' && (
          <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
            <LibraryContent category={route.category} />
          </main>
        )}

        {route.page === 'guide' && (
          <main className="flex-1 py-10 px-6">
            <div
              className={`mx-auto ${
                historyOpen
                  ? 'max-w-[1032px]'
                  : guideStepCount >= STEP_RAIL_MIN_STEPS
                    ? 'max-w-[720px] xl:max-w-[980px]'
                    : 'max-w-[720px]'
              }`}
            >
              <GuideContent guideId={route.guideId} initialStepId={route.stepId} initialTool={route.tool} />
            </div>
          </main>
        )}

        {import.meta.env.BROWSER !== 'firefox' && <VoiceNotice />}
      </div>
    </TooltipProvider>
  );
}
