import { i18n } from '#imports';
import { actionSteps, stepNumbers } from '@/core/guides/blocks';
import type { Step } from '@/core/guides/types';
import { useFullview } from '@/stores/fullview';

interface GuideStepRailProps {
  steps: Step[];
}

function stepLabel(step: Step): string {
  const text = (step.description || '').trim().split('\n')[0];
  return text || i18n.t('guideme.noDescription');
}

export default function GuideStepRail({ steps }: GuideStepRailProps) {
  const { activeStepId, scrollToStep } = useFullview((s) => ({
    activeStepId: s.activeStepId,
    scrollToStep: s.scrollToStep,
  }));

  const listed = actionSteps(steps);
  if (listed.length < 4) return null;

  const numbers = stepNumbers(steps);

  return (
    <nav className="hidden xl:block w-[220px] shrink-0 sticky top-6 self-start max-h-[calc(100vh-96px)] overflow-y-auto">
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5 text-muted-foreground">
        {i18n.t('fullview.steps')}
      </p>
      <ul className="flex flex-col gap-0.5">
        {listed.map((step) => {
          const active = step.id === activeStepId;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => scrollToStep(step.id)}
                className={`w-full flex items-start gap-2.5 text-left px-2.5 py-2 rounded-lg transition-colors ${
                  active ? 'bg-secondary' : 'hover:bg-secondary/60'
                }`}
              >
                <span
                  className={`text-[11px] font-bold tabular-nums shrink-0 w-4 pt-px ${
                    active ? 'text-accent' : 'text-muted-foreground'
                  }`}
                >
                  {numbers.get(step.id)}
                </span>
                <span
                  className={`text-[12px] leading-snug line-clamp-2 ${
                    active ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {stepLabel(step)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
