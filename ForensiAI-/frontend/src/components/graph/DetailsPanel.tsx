import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Calendar, Activity, Lightbulb, BookOpen, Trash2 } from 'lucide-react';
import type { InvestigationNodeData } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DetailsPanelProps {
  nodeData: InvestigationNodeData;
  onClose: () => void;
  onUpdate?: (data: Partial<InvestigationNodeData>) => void;
  onDelete?: () => void;
}

export function DetailsPanel({ nodeData, onClose, onUpdate, onDelete }: DetailsPanelProps) {
  const [draft, setDraft] = useState({
    label: nodeData.label || '',
    description: nodeData.description || '',
    personName: nodeData.personName || '',
    locationName: nodeData.locationName || '',
    evidenceFile: nodeData.evidenceFile || '',
    noteContent: nodeData.noteContent || '',
    contradictionText: nodeData.contradictionText || '',
  });

  useEffect(() => {
    setDraft({
      label: nodeData.label || '',
      description: nodeData.description || '',
      personName: nodeData.personName || '',
      locationName: nodeData.locationName || '',
      evidenceFile: nodeData.evidenceFile || '',
      noteContent: nodeData.noteContent || '',
      contradictionText: nodeData.contradictionText || '',
    });
  }, [nodeData]);

  if (!nodeData) return null;

  const isRisk = !!nodeData.flag;
  const isTimeline = !!nodeData.event;
  const isHypothesis = !!nodeData.hypothesis;
  const isStory = !!nodeData.story;
  const isBeat = !!nodeData.beat;
  const isUserNode = nodeData.source === 'user';

  const saveUserNode = () => {
    onUpdate?.({
      ...draft,
      label: draft.label.trim() || nodeData.label,
      description: draft.description.trim(),
      personName: draft.personName.trim(),
      locationName: draft.locationName.trim(),
      evidenceFile: draft.evidenceFile.trim(),
      noteContent: draft.noteContent.trim(),
      contradictionText: draft.contradictionText.trim(),
    });
  };

  return (
    <div className="absolute right-0 top-0 z-50 flex h-full w-[380px] max-w-full flex-col border-l border-slate-700 bg-slate-900/95 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-200">
          {isRisk && <AlertTriangle className="h-5 w-5 text-red-400" />}
          {isTimeline && <Activity className="h-5 w-5 text-cyan-400" />}
          {isHypothesis && <Lightbulb className="h-5 w-5 text-amber-400" />}
          {isStory && <BookOpen className="h-5 w-5 text-sky-400" />}
          {isBeat && <BookOpen className="h-5 w-5 text-indigo-400" />}
          {!isRisk && !isTimeline && !isHypothesis && !isStory && !isBeat && <Lightbulb className="h-5 w-5 text-slate-300" />}
          {isRisk ? "Risk Anomaly Details" : isHypothesis ? "AI Conclusion Details" : isStory ? "Executive Story" : isBeat ? "Story Beat" : isTimeline ? "Timeline Event Details" : "Investigator Node"}
        </h3>
        <button onClick={onClose} className="rounded-md p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {isUserNode && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Label</label>
              <input
                value={draft.label}
                onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/70"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Description</label>
              <textarea
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                rows={4}
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/70"
              />
            </div>

            {nodeData.category === 'people' && (
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Person Name</label>
                <input
                  value={draft.personName}
                  onChange={(event) => setDraft((current) => ({ ...current, personName: event.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/70"
                />
              </div>
            )}

            {nodeData.category === 'location' && (
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Location Name</label>
                <input
                  value={draft.locationName}
                  onChange={(event) => setDraft((current) => ({ ...current, locationName: event.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/70"
                />
              </div>
            )}

            {nodeData.category === 'evidence' && (
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Evidence File</label>
                <input
                  value={draft.evidenceFile}
                  onChange={(event) => setDraft((current) => ({ ...current, evidenceFile: event.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/70"
                />
              </div>
            )}

            {nodeData.category === 'note' && (
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Note</label>
                <textarea
                  value={draft.noteContent}
                  onChange={(event) => setDraft((current) => ({ ...current, noteContent: event.target.value }))}
                  rows={5}
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/70"
                />
              </div>
            )}

            {nodeData.category === 'ai_flag' && (
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Flag Detail</label>
                <textarea
                  value={draft.contradictionText}
                  onChange={(event) => setDraft((current) => ({ ...current, contradictionText: event.target.value }))}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/70"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveUserNode}
                className="flex flex-1 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="grid h-10 w-10 place-items-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 transition hover:bg-red-500/20"
                title="Delete node"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {isTimeline && (
          <>
            <DetailBadge label="Source">{nodeData.event?.source}</DetailBadge>
            {nodeData.event?.severity && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Severity</p>
                <div className={cn(
                  "inline-block rounded px-3 py-1 text-sm font-medium uppercase",
                  nodeData.event.severity === 'high' ? "bg-red-500/20 text-red-300" : "bg-slate-800 text-slate-300"
                )}>
                  {nodeData.event.severity}
                </div>
              </div>
            )}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Timestamp</p>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Calendar className="h-4 w-4 text-slate-500" />
                {nodeData.event?.timestamp ? new Date(nodeData.event.timestamp).toLocaleString() : 'Unknown'}
              </div>
            </div>
            <DetailBox label="Event Description">{nodeData.event?.event}</DetailBox>
          </>
        )}

        {isRisk && (
          <>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Anomaly Flag</p>
              <h4 className="text-lg font-bold text-red-400">{nodeData.flag?.name || 'Unknown Flag'}</h4>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Risk Score</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-red-400">{nodeData.flag?.score}</span>
                <span className="mb-1 text-sm text-slate-500">/ 100</span>
              </div>
            </div>
            <DetailBox label="Description" tone="red">{nodeData.flag?.description}</DetailBox>
          </>
        )}

        {isHypothesis && (
          <>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">AI Conclusion</p>
              <h4 className="text-lg font-bold text-amber-400">{nodeData.hypothesis?.title}</h4>
            </div>
            <DetailBadge label="Confidence Level" tone="amber">{nodeData.hypothesis?.confidence}</DetailBadge>
            <DetailBox label="AI Reasoning" tone="amber">{nodeData.hypothesis?.reasoning}</DetailBox>
          </>
        )}

        {isStory && <DetailBox label="Crime Story Summary" tone="sky">{nodeData.story}</DetailBox>}

        {isBeat && (
          <>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Story Beat Title</p>
              <h4 className="text-lg font-bold text-indigo-400">{nodeData.beat?.title}</h4>
            </div>
            <DetailBox label="Narrative Scene" tone="indigo">{nodeData.beat?.description}</DetailBox>
            {nodeData.beat?.timestamp_guess && <DetailBadge label="Estimated Timeline">{nodeData.beat.timestamp_guess}</DetailBadge>}
            {nodeData.beat?.connected_evidence && <DetailBadge label="Corroborating Evidence">{nodeData.beat.connected_evidence}</DetailBadge>}
          </>
        )}
      </div>
    </div>
  );
}

function DetailBadge({ label, tone = 'slate', children }: { label: string; tone?: 'slate' | 'amber'; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className={cn(
        "inline-block rounded px-3 py-1 text-sm font-medium",
        tone === 'amber' ? "bg-amber-500/20 text-amber-300" : "bg-slate-800 text-cyan-200"
      )}>
        {children}
      </div>
    </div>
  );
}

function DetailBox({ label, tone = 'slate', children }: { label: string; tone?: 'slate' | 'red' | 'amber' | 'sky' | 'indigo'; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className={cn(
        "rounded-lg border p-4 text-sm leading-relaxed text-slate-200",
        tone === 'red' && "border-red-900/30 bg-red-950/20",
        tone === 'amber' && "border-amber-900/30 bg-amber-950/20",
        tone === 'sky' && "border-sky-900/30 bg-sky-950/20",
        tone === 'indigo' && "border-indigo-900/30 bg-indigo-950/20",
        tone === 'slate' && "border-slate-700/50 bg-slate-800/50"
      )}>
        {children || 'No detail available.'}
      </div>
    </div>
  );
}
