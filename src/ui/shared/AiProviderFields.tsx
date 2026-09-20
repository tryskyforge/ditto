import { Globe, TriangleAlert } from 'lucide-react';
import { i18n } from '#imports';
import {
  AI_PROVIDERS,
  type AIProviderKey,
  CUSTOM_MODEL_VALUE,
  DEFAULT_AI_PROVIDER,
  hasPresetModels,
  modelOptions,
  modelPlaceholder,
  requiresApiKey,
  SELF_HOSTED_AI_PROVIDER,
  selectableModelIds,
} from '@/core/capture/ai/models';
import { Input } from '@/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/components/ui/select';
import { KeyStatusNote, KeyWarningNote, ModelList, SecretInput, type useKeyCheck } from '@/ui/shared/key-check';

export type AiProviderFieldsVariant = 'compact' | 'wizard';

export interface AiProviderFieldsProps {
  variant: AiProviderFieldsVariant;
  provider: AIProviderKey;
  onProviderChange: (provider: AIProviderKey) => void;
  model: string;
  customModel: boolean;
  onModelSelect: (value: string) => void;
  onModelInput: (value: string) => void;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  baseUrl: string;
  onBaseUrlChange: (value: string) => void;
  ownServer: boolean;
  onOwnServerToggle: () => void;
  keyCheck: ReturnType<typeof useKeyCheck>;
  showMissingKeyWarning?: boolean;
  checkButton: (props: { disabled: boolean; onClick: () => void; label: string }) => React.ReactNode;
}

const STYLES = {
  compact: {
    label: 'block text-[11px] font-semibold text-foreground mb-1',
    trigger: 'h-8',
    input: 'h-8 text-[13px] rounded-lg border-border',
    icon: 11,
    note: 'mt-1.5 text-[10px] text-muted-foreground leading-relaxed',
    alert: 'mt-1.5 flex items-start gap-1.5 text-[10px] text-destructive leading-relaxed',
    track: 'w-9 h-5',
    knob: 'w-4 h-4',
    gap: 'space-y-1.5',
  },
  wizard: {
    label: 'block text-xs font-semibold text-foreground mb-1.5',
    trigger: 'w-full h-11 rounded-xl px-4 text-sm focus:border-accent focus:ring-accent/10',
    input: 'w-full h-11 rounded-xl px-4 text-sm focus:border-accent focus:ring-accent/10',
    icon: 12,
    note: 'mt-1.5 text-[11px] text-muted-foreground leading-relaxed',
    alert: 'mt-1.5 flex items-start gap-1.5 text-[11px] text-destructive leading-relaxed',
    track: 'w-10 h-6',
    knob: 'w-5 h-5',
    gap: 'space-y-2',
  },
} as const;

export function useAiProviderView(
  provider: AIProviderKey,
  model: string,
  customModel: boolean,
  models: string[] | null,
) {
  const config = AI_PROVIDERS[provider] ?? AI_PROVIDERS[DEFAULT_AI_PROVIDER];
  const available = modelOptions(config, models);
  const selectable = selectableModelIds(available);
  return {
    config,
    available,
    usingCustomModel:
      customModel || selectable.length === 0 || (model.trim() !== '' && !selectable.includes(model.trim())),
    isSelfHosted: provider === SELF_HOSTED_AI_PROVIDER,
    keyRequired: requiresApiKey(provider),
  };
}

export default function AiProviderFields({
  variant,
  provider,
  onProviderChange,
  model,
  customModel,
  onModelSelect,
  onModelInput,
  apiKey,
  onApiKeyChange,
  baseUrl,
  onBaseUrlChange,
  ownServer,
  onOwnServerToggle,
  keyCheck,
  showMissingKeyWarning = false,
  checkButton,
}: AiProviderFieldsProps) {
  const s = STYLES[variant];
  const { config, available, usingCustomModel, isSelfHosted, keyRequired } = useAiProviderView(
    provider,
    model,
    customModel,
    keyCheck.models,
  );
  const serverUrlOpen = ownServer || isSelfHosted;

  return (
    <>
      <div>
        <label className={s.label}>{i18n.t('settings.provider')}</label>
        <Select value={provider} onValueChange={(v) => onProviderChange(v as AIProviderKey)}>
          <SelectTrigger className={s.trigger}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(AI_PROVIDERS).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className={s.label}>{i18n.t('settings.model')}</label>
        <Select value={usingCustomModel ? CUSTOM_MODEL_VALUE : model} onValueChange={onModelSelect}>
          <SelectTrigger className={s.trigger}>
            <SelectValue placeholder={modelPlaceholder(config)} />
          </SelectTrigger>
          <SelectContent>
            {available.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {usingCustomModel && (
          <Input
            type="text"
            value={model}
            onChange={(e) => onModelInput(e.target.value)}
            placeholder={modelPlaceholder(config)}
            aria-label={i18n.t('settings.modelCustom')}
            className={`mt-1.5 ${s.input}`}
          />
        )}
      </div>

      <div>
        <label className={s.label}>{i18n.t('settings.apiKey')}</label>
        {variant === 'compact' ? (
          <div className="flex items-center gap-1.5">
            <SecretInput
              value={apiKey}
              onChange={onApiKeyChange}
              placeholder={keyRequired ? 'sk-...' : i18n.t('settings.apiKeyOptional')}
              className={s.input}
            />
            {checkButton({
              disabled: (keyRequired && !apiKey) || keyCheck.status === 'checking',
              onClick: () => {
                if (keyCheck.status !== 'checking') void keyCheck.check(provider, apiKey, baseUrl, model);
              },
              label: i18n.t('settings.checkKey'),
            })}
          </div>
        ) : (
          <SecretInput
            value={apiKey}
            onChange={onApiKeyChange}
            placeholder={keyRequired ? 'sk-...' : i18n.t('settings.apiKeyOptional')}
            className={s.input}
            buttonClassName="right-3"
          />
        )}

        {!keyRequired && !apiKey.trim() && <p className={s.note}>{i18n.t('settings.selfHostedNoKeyNeeded')}</p>}

        {variant === 'compact' ? (
          <>
            <KeyStatusNote status={keyCheck.status} />
            <KeyWarningNote warning={keyCheck.warning} />
          </>
        ) : (
          <div className="flex items-center gap-3 mt-2">
            {checkButton({
              disabled: (keyRequired && !apiKey) || keyCheck.status === 'checking',
              onClick: () => {
                if (keyCheck.status !== 'checking') void keyCheck.check(provider, apiKey, baseUrl, model);
              },
              label: i18n.t('settings.checkKey'),
            })}
            <div className="min-w-0">
              <KeyStatusNote status={keyCheck.status} />
              <KeyWarningNote warning={keyCheck.warning} />
            </div>
          </div>
        )}

        {keyCheck.models && hasPresetModels(config) && <ModelList models={keyCheck.models} />}

        {showMissingKeyWarning && keyRequired && !apiKey.trim() && (
          <p className={s.alert} role="alert">
            <TriangleAlert size={s.icon} className="shrink-0 mt-0.5" />
            <span>{i18n.t('settings.aiNoKey')}</span>
          </p>
        )}
      </div>

      <div>
        {isSelfHosted ? (
          <label className={`${s.label} flex items-center gap-1`}>
            <Globe size={s.icon} className="-mt-px" />
            {i18n.t('settings.serverUrl')}
          </label>
        ) : (
          <div className={`flex items-center justify-between gap-3 ${variant === 'compact' ? 'py-0.5' : ''}`}>
            <span
              className={`${variant === 'compact' ? 'text-[11px]' : 'text-xs'} font-semibold text-foreground flex items-center gap-1`}
            >
              <Globe size={s.icon} className="-mt-px" />
              {i18n.t('settings.useOwnServer')}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={ownServer}
              aria-label={i18n.t('settings.useOwnServer')}
              onClick={onOwnServerToggle}
              className={`${s.track} rounded-full transition-colors relative shrink-0 ${
                ownServer ? 'bg-accent' : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 ${s.knob} rounded-full bg-white shadow-sm transition-transform ${
                  ownServer ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}
        {serverUrlOpen && (
          <div className={isSelfHosted ? s.gap : `mt-2 ${s.gap}`}>
            <Input
              type="text"
              value={baseUrl}
              onChange={(e) => onBaseUrlChange(e.target.value)}
              placeholder={config.defaultBaseUrl}
              aria-label={i18n.t(isSelfHosted ? 'settings.serverUrl' : 'settings.baseUrl')}
              className={s.input}
            />
            <p
              className={
                variant === 'compact'
                  ? 'text-[10px] text-muted-foreground leading-relaxed'
                  : 'text-[11px] text-muted-foreground leading-relaxed'
              }
            >
              {i18n.t(
                isSelfHosted
                  ? 'settings.selfHostedServerHint'
                  : config.protocol === 'anthropic'
                    ? 'settings.ownServerHintAnthropic'
                    : 'settings.ownServerHintOpenai',
              )}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
