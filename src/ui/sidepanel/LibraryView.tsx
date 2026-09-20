import { Star, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { i18n } from '#imports';
import {
  type GuideChangeEvent,
  getGuideDomain,
  getGuides,
  onGuidesChanged,
  softDeleteGuide,
  toggleStar,
} from '@/core/guides/service';
import type { Guide } from '@/core/guides/types';
import { formatRelativeTime } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/components/ui/tooltip';
import FaviconImg from '@/ui/shared/FaviconImg';
import MascotIcon from '@/ui/shared/MascotIcon';

interface LibraryViewProps {
  onOpen: (guideId: string) => void;
  onStartRecording?: () => void;
  isAlive?: boolean;
  searchQuery?: string;
}

interface GuideWithMeta extends Guide {
  domain: string;
}

export default function LibraryView({ onOpen, searchQuery = '' }: LibraryViewProps) {
  const [guides, setGuides] = useState<GuideWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGuides = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getGuides();
      const withMeta: GuideWithMeta[] = await Promise.all(
        result.map(async (guide) => {
          const domain = await getGuideDomain(guide.id);
          return {
            ...guide,
            domain,
          };
        }),
      );
      setGuides(withMeta);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGuides();
  }, [loadGuides]);

  useEffect(
    () =>
      onGuidesChanged((event: GuideChangeEvent) => {
        if (event.type === 'starred') {
          setGuides((prev) => prev.map((g) => (g.id === event.id ? { ...g, starred: event.starred } : g)));
        } else {
          loadGuides();
        }
      }),
    [loadGuides],
  );

  const handleStar = useCallback(async (e: React.MouseEvent, guideId: string) => {
    e.stopPropagation();
    setGuides((prev) => prev.map((g) => (g.id === guideId ? { ...g, starred: !g.starred } : g)));
    await toggleStar(guideId);
  }, []);

  const handleDelete = useCallback(
    async (e: React.MouseEvent, guideId: string) => {
      e.stopPropagation();
      await softDeleteGuide(guideId);
      await loadGuides();
    },
    [loadGuides],
  );

  const filtered = searchQuery
    ? guides.filter((g) => g.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : guides;

  if (loading) {
    return <p className="text-sm py-4 text-purple">{i18n.t('common.loading')}</p>;
  }

  if (guides.length === 0) {
    return (
      <div className="py-10 text-center flex flex-col items-center">
        <div className="animate-[float_3s_ease-in-out_infinite]">
          <style>{'@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}'}</style>
          <MascotIcon size={80} coffee />
        </div>
        <p className="text-sm font-medium text-foreground mt-3">{i18n.t('library.noGuidesTitle')}</p>
        <p className="text-xs mt-1 text-purple">{i18n.t('library.noGuidesSub')}</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-purple">{i18n.t('library.noMatchingGuides')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-1 pb-4">
      {filtered.map((guide) => {
        const isEmpty = guide.stepIds.length === 0;
        return (
          <div
            key={guide.id}
            className="flex items-start gap-3 px-3.5 py-3 rounded-[14px] cursor-pointer group transition-all bg-card border border-border hover:border-violet hover:shadow-sm"
            onClick={() => onOpen(guide.id)}
          >
            <div className="w-[26px] h-[26px] mt-0.5 rounded-lg bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
              <FaviconImg domain={guide.domain} size={16} />
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={`text-[13px] font-semibold truncate ${isEmpty ? 'text-muted-foreground' : 'text-foreground'}`}
              >
                {guide.title}
              </p>
              {guide.description && (
                <p className="text-[11px] mt-1 text-muted-foreground line-clamp-1">{guide.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-muted-foreground">{formatRelativeTime(guide.updatedAt)}</span>
                {guide.stepIds.length > 0 && (
                  <span className="text-[9px] font-semibold text-accent bg-secondary px-2 py-1 rounded-full leading-none">
                    {guide.stepIds.length !== 1
                      ? i18n.t('fullview.stepCountPlural', [String(guide.stepIds.length)])
                      : i18n.t('fullview.stepCount', [String(guide.stepIds.length)])}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => handleStar(e, guide.id)}
                    className={`p-1.5 rounded-lg transition-all hover:text-accent ${guide.starred ? 'text-accent' : 'text-border'}`}
                  >
                    <Star size={13} fill={guide.starred ? 'currentColor' : 'none'} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{guide.starred ? i18n.t('common.unstar') : i18n.t('common.star')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => handleDelete(e, guide.id)}
                    className="p-1.5 rounded-lg transition-all text-border hover:text-destructive"
                  >
                    <Trash2 size={13} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{i18n.t('library.moveToTrash')}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        );
      })}
    </div>
  );
}
