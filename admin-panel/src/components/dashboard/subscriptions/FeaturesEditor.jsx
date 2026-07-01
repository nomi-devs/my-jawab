// src/components/dashboard/subscriptions/FeaturesEditor.jsx
//
// Editor for a subscription plan's `features` JSON column.
// Shows booleans as toggles and numeric quotas as number inputs.
// Use -1 in numeric fields for "unlimited".
//
// Props:
//   value:    current features object (or null/undefined)
//   onChange: (newFeaturesObject) => void
//   disabled: boolean
//
import React from 'react';
import {
  Sparkles,
  Infinity as InfinityIcon,
  Check,
  X,
  FileText,
  MessageSquare,
  Users,
  Hash,
  Video,
  BadgeCheck,
  Headphones,
  Rocket,
  EyeOff,
  User,
} from 'lucide-react';

// ─── Feature definitions ───────────────────────────────
// Each feature has: key, label, description, type, icon, (for numeric) unit
const BOOLEAN_FEATURES = [
  {
    key: 'can_create_polls',
    label: 'Create polls',
    icon: FileText,
    description: 'Allow creating polls',
  },
  {
    key: 'can_create_communities',
    label: 'Create communities',
    icon: Users,
    description: 'Allow creating new communities',
  },
  {
    key: 'video_uploads',
    label: 'Video uploads',
    icon: Video,
    description: 'Allow attaching videos to posts',
  },
  {
    key: 'verified_badge',
    label: 'Verified badge',
    icon: BadgeCheck,
    description: 'Show verified badge on profile',
  },
  {
    key: 'priority_support',
    label: 'Priority support',
    icon: Headphones,
    description: 'Access to priority support channel',
  },
  {
    key: 'early_access',
    label: 'Early access',
    icon: Rocket,
    description: 'Access to beta features',
  },
  {
    key: 'ads_enabled',
    label: 'Show ads / banners',
    icon: EyeOff,
    description: 'If true, users on this plan see ad banners in feed',
    inverse: true,
  },
];

const NUMERIC_FEATURES = [
  { key: 'daily_post_limit', label: 'Daily post limit', icon: FileText, unit: 'posts/day' },
  {
    key: 'daily_comment_limit',
    label: 'Daily comment limit',
    icon: MessageSquare,
    unit: 'comments/day',
  },
  {
    key: 'max_communities_joined',
    label: 'Max communities joined',
    icon: Users,
    unit: 'communities',
  },
  { key: 'max_topic_subscriptions', label: 'Max topic subscriptions', icon: Hash, unit: 'topics' },
  { key: 'max_video_size_mb', label: 'Max video size', icon: Video, unit: 'MB' },
  { key: 'max_bio_length', label: 'Max bio length', icon: User, unit: 'chars' },
];

const FeaturesEditor = ({ value, onChange, disabled = false }) => {
  const features = value || {};

  const set = (key, newVal) => {
    onChange({ ...features, [key]: newVal });
  };

  const setUnlimited = (key) => set(key, -1);

  return (
    <div className="space-y-5">
      {/* ── Entitlements (booleans) ──────────────────── */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles size={14} className="text-purple-500" />
          <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Entitlements
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {BOOLEAN_FEATURES.map((f) => {
            const Icon = f.icon;
            const isOn = features[f.key] === true;
            return (
              <div
                key={f.key}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <Icon size={14} className="text-purple-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {f.label}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {f.description}
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-2 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={isOn}
                    onChange={(e) => set(f.key, e.target.checked)}
                    disabled={disabled}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Quotas (numeric) ─────────────────────────── */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <InfinityIcon size={14} className="text-purple-500" />
          <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Quotas & Limits
          </h4>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-normal normal-case ml-1">
            (use -1 for unlimited, 0 to disable)
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {NUMERIC_FEATURES.map((f) => {
            const Icon = f.icon;
            const val = features[f.key];
            const isUnlimited = val === -1;
            return (
              <div
                key={f.key}
                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon size={14} className="text-purple-500" />
                  <label className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {f.label}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={val === undefined ? '' : val}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') return set(f.key, undefined);
                        set(f.key, parseInt(v, 10));
                      }}
                      disabled={disabled || isUnlimited}
                      className={`w-full pl-3 pr-16 py-1.5 text-xs border rounded-lg transition-all ${
                        isUnlimited
                          ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-medium cursor-not-allowed'
                          : 'bg-white dark:bg-gray-700 border-purple-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                      }`}
                      placeholder="0"
                    />
                    {isUnlimited ? (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-purple-700 dark:text-purple-300 font-bold pointer-events-none">
                        <InfinityIcon size={10} />
                        UNLIMITED
                      </span>
                    ) : (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
                        {f.unit}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => (isUnlimited ? set(f.key, 0) : setUnlimited(f.key))}
                    disabled={disabled}
                    className={`flex-shrink-0 px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded border transition-colors ${
                      isUnlimited
                        ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-purple-200 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-gray-600'
                    }`}
                    title="Toggle unlimited (-1)"
                  >
                    {isUnlimited ? (
                      <X size={10} className="inline" />
                    ) : (
                      <InfinityIcon size={10} className="inline" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Summary ──────────────────────────────────── */}
      <div className="p-3 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-800/30">
        <div className="flex items-center gap-2 text-[11px] text-purple-700 dark:text-purple-300">
          <Check size={12} />
          <span className="font-medium">
            {Object.keys(features).length} feature{Object.keys(features).length !== 1 && 's'}{' '}
            configured
          </span>
          <span className="text-gray-500 dark:text-gray-400">·</span>
          <span className="text-gray-500 dark:text-gray-400">
            Saved as JSON in the{' '}
            <code className="text-purple-600 dark:text-purple-400 bg-white/50 dark:bg-gray-800/50 px-1 rounded">
              features
            </code>{' '}
            column
          </span>
        </div>
      </div>
    </div>
  );
};

export default FeaturesEditor;
