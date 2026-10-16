import React, { useCallback, useRef, useState } from 'react';
import { FileUp, Link2, Loader2, ChevronDown, CheckCircle2, AlertTriangle, Search, Check, Undo2, Plus, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useApp } from '../../context/AppContext';
import { confirmDialog } from '../../lib/dialogs';
import { isDesignerOrVideomaker } from '../../lib/taskUtils';
import type { Task } from '../../types';
import {
  ParsedBriefing,
  extractTextFromDocx,
  fetchGoogleDocText,
  normalizeDocText,
  parseBriefing,
} from '../../lib/briefingDoc';

type SourceTab = 'file' | 'link';
type Step = 'document' | 'settings' | 'result';

const STEPS: { id: Step; label: string }[] = [
  { id: 'document', label: 'Documento' },
  { id: 'settings', label: 'Clientes e prazo' },
  { id: 'result', label: 'Resultado' },
];

const norm = (v: string) => v.toLowerCase().replace(/\s+/g, ' ').trim();

/** "2026-10-20T18:00" (campo datetime-local) -> "20/10/2026 18:00", o mesmo formato do prazo da tarefa. */
const toDueDate = (value: string): string => {
  const [date, time] = value.split('T');
  const [y, m, d] = (date || '').split('-');
  return y && m && d ? `${d}/${m}/${y}${time ? ` ${time}` : ''}` : '';
};

/** Tarefas em massa: lê um documento (arquivo .docx ou link do Google Docs) e mostra as demandas encontradas. */
export const BulkTasksModal: React.FC = () => {
  const {
    isBulkTasksModalOpen,
    setIsBulkTasksModalOpen,
    projects,
    tasks,
    employees,
    spineStatuses,
    currentSprint,
    addTasksBulk,
    deleteTasksBulk,
    addToast,
  } = useApp();

  const [step, setStep] = useState<Step>('document');
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [dueValue, setDueValue] = useState('');
  const [statusId, setStatusId] = useState('');
  const [testOnly, setTestOnly] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [outcome, setOutcome] = useState<{ createdIds: string[]; failed: number; skipped: number } | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);

  // Responsáveis por faixa de demandas (ex.: 1 a 50 -> Designer X)
  interface AssignRange {
    id: number;
    from: string;
    to: string;
    employeeId: string;
  }
  const [ranges, setRanges] = useState<AssignRange[]>([{ id: 1, from: '', to: '', employeeId: '' }]);
  const nextRangeId = useRef(2);

  const [tab, setTab] = useState<SourceTab>('file');
  const [link, setLink] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [briefing, setBriefing] = useState<ParsedBriefing | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setLink('');
    setError(null);
    setBriefing(null);
    setSourceName('');
    setExpanded(null);
  }, []);

  const resetAll = () => {
    reset();
    setStep('document');
    setSelectedClientIds([]);
    setClientSearch('');
    setDueValue('');
    setStatusId('');
    setTestOnly(false);
    setRanges([{ id: 1, from: '', to: '', employeeId: '' }]);
    nextRangeId.current = 2;
    setProgress({ done: 0, total: 0 });
    setOutcome(null);
  };

  const close = () => {
    if (isCreating || isUndoing) return;
    setIsBulkTasksModalOpen(false);
    resetAll();
  };

  // Coluna inicial padrão: "Novos Pedidos" se existir; senão a primeira do quadro
  const effectiveStatusId =
    statusId || spineStatuses.find((s) => s.id === 'novos_pedidos')?.id || spineStatuses[0]?.id || 'backlog';

  const selectedClients = projects.filter((p) => selectedClientIds.includes(p.id));
  const category = selectedClients.map((c) => c.name).join(', ');

  // Demandas que já existem (mesmo título e mesmos clientes) não são criadas de novo
  const existingKeys = new Set(tasks.map((t) => `${norm(t.title)}|${norm(t.category || '')}`));
  const toCreate = (briefing?.demandas ?? []).filter((d) => !existingKeys.has(`${norm(d.title)}|${norm(category)}`));
  const skipped = (briefing?.demandas.length ?? 0) - toCreate.length;
  const batch = testOnly ? toCreate.slice(0, 2) : toCreate;

  const creatives = employees.filter((e) => isDesignerOrVideomaker(e)).sort((a, b) => a.name.localeCompare(b.name));

  // Faixas: linhas totalmente vazias são ignoradas; as demais precisam estar completas e sem sobreposição
  const rangeStates = ranges.map((r) => {
    const from = Number(r.from);
    const to = Number(r.to);
    const touched = r.from !== '' || r.to !== '' || r.employeeId !== '';
    const complete = r.from !== '' && r.to !== '' && r.employeeId !== '' && Number.isFinite(from) && Number.isFinite(to);
    let error = '';
    if (touched && !complete) error = 'Preencha os dois números e escolha o responsável.';
    else if (complete && from > to) error = 'O primeiro número não pode ser maior que o segundo.';
    return { ...r, from, to, touched, complete, error };
  });
  const validRanges = rangeStates.filter((r) => r.complete && !r.error);
  const overlapError = validRanges.some((a, i) => validRanges.some((b, j) => i < j && a.from <= b.to && b.from <= a.to))
    ? 'Há faixas que se sobrepõem: uma demanda só pode ter um responsável.'
    : '';
  const rangesInvalid = rangeStates.some((r) => !!r.error) || !!overlapError;
  const assigneeFor = (num: number) => {
    const r = validRanges.find((x) => num >= x.from && num <= x.to);
    return r ? employees.find((e) => e.id === r.employeeId) : undefined;
  };
  const assignedCount = batch.filter((d) => assigneeFor(d.number)).length;

  const canCreate = selectedClients.length > 0 && !!toDueDate(dueValue) && batch.length > 0 && !rangesInvalid;

  const createTasks = async () => {
    if (!briefing || !canCreate) return;
    const dueDate = toDueDate(dueValue);
    const ok = await confirmDialog({
      title: testOnly ? 'Criar tarefas de teste' : 'Criar tarefas em massa',
      message: `${batch.length} ${batch.length === 1 ? 'tarefa será criada' : 'tarefas serão criadas'} para ${category}, com prazo ${dueDate}${assignedCount > 0 ? `, ${assignedCount} com responsável` : ''}.${skipped > 0 ? ` ${skipped} já existente(s) serão ignoradas.` : ''}`,
      confirmLabel: `Criar ${batch.length}`,
    });
    if (!ok) return;

    const labels = selectedClients.map((c) => ({
      id: c.labelId || `lbl-${c.id}`,
      name: c.name,
      color: c.labelColor || '#E4007E',
    }));
    // Mesmo formato que a janela de tarefa grava (clientes como etiquetas, 1º cliente como projeto)
    const list = batch.map((d): Omit<Task, 'id' | 'createdAt'> => {
      const owner = assigneeFor(d.number);
      return {
          title: d.title,
          description: d.description,
          category,
          projectId: selectedClients[0].name,
          projectName: selectedClients[0].name,
          sprintId: currentSprint?.id || 'sprint-1',
          dueDate,
          deliveredAt: '',
          status: effectiveStatusId,
          points: 1,
          isFlagged: false,
          labels,
          referenceImages: [],
          attachments: [],
          comments: [],
          checklists: [],
          members: owner ? [{ id: owner.id, name: owner.name, initials: owner.initials, avatarUrl: owner.avatarUrl }] : [],
          assigneeId: owner?.id || 'unassigned',
          assigneeName: owner?.name || 'Sem membro',
          assigneeInitials: owner?.initials || 'SM',
        } as unknown as Omit<Task, 'id' | 'createdAt'>;
    });

    setIsCreating(true);
    setProgress({ done: 0, total: list.length });
    try {
      const { createdIds, failed } = await addTasksBulk(list, (done, total) => setProgress({ done, total }));
      setOutcome({ createdIds, failed, skipped });
      setStep('result');
      if (createdIds.length > 0) addToast('Tarefas criadas', `${createdIds.length} tarefas adicionadas ao quadro.`, 'success');
    } finally {
      setIsCreating(false);
    }
  };

  const undoImport = async () => {
    if (!outcome || outcome.createdIds.length === 0) return;
    const ok = await confirmDialog({
      title: 'Desfazer importação',
      message: `Excluir as ${outcome.createdIds.length} tarefas criadas agora? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir tarefas',
      tone: 'danger',
    });
    if (!ok) return;
    setIsUndoing(true);
    try {
      await deleteTasksBulk(outcome.createdIds);
      addToast('Importação desfeita', `${outcome.createdIds.length} tarefas excluídas.`, 'info');
      setOutcome({ ...outcome, createdIds: [] });
    } finally {
      setIsUndoing(false);
    }
  };

  const visibleClients = projects.filter((p) => norm(p.name).includes(norm(clientSearch)));

  const applyText = (text: string, name: string) => {
    const parsed = parseBriefing(text);
    if (parsed.demandas.length === 0) {
      setBriefing(null);
      setError('Não encontrei nenhuma demanda neste documento. Cada demanda precisa começar com "DEMANDA 001  |  CÓDIGO  ·  Categoria  ·  Jogo".');
      return;
    }
    setBriefing(parsed);
    setSourceName(name);
    setExpanded(null);
  };

  const readFile = async (file: File) => {
    setError(null);
    setBriefing(null);
    setIsReading(true);
    try {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.docx')) {
        applyText(await extractTextFromDocx(await file.arrayBuffer()), file.name);
      } else if (lower.endsWith('.txt')) {
        applyText(normalizeDocText(await file.text()), file.name);
      } else {
        throw new Error('Formato não suportado. Envie um arquivo .docx (Word) ou .txt.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível ler o arquivo.');
    } finally {
      setIsReading(false);
    }
  };

  const readLink = async () => {
    setError(null);
    setBriefing(null);
    setIsReading(true);
    try {
      applyText(await fetchGoogleDocText(link.trim()), 'Google Docs');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível ler o link.');
    } finally {
      setIsReading(false);
    }
  };

  const byCategory = briefing
    ? Object.entries(
        briefing.demandas.reduce<Record<string, number>>((acc, d) => {
          acc[d.category || 'Sem categoria'] = (acc[d.category || 'Sem categoria'] || 0) + 1;
          return acc;
        }, {})
      )
    : [];
  const totalVariations = briefing?.demandas.reduce((sum, d) => sum + d.variations, 0) ?? 0;

  return (
    <Modal
      isOpen={isBulkTasksModalOpen}
      onClose={close}
      title="Tarefas em massa"
      description="Cria várias demandas de uma vez a partir de um documento."
      size="xl"
    >
      {/* Etapas */}
      <ol className="flex items-center gap-2 mb-5 text-xs" aria-label="Etapas">
        {STEPS.map((st, idx) => {
          const current = STEPS.findIndex((x) => x.id === step);
          const state = idx < current ? 'done' : idx === current ? 'current' : 'todo';
          return (
            <li key={st.id} aria-current={state === 'current' ? 'step' : undefined} className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                  state === 'todo' ? 'bg-raised text-fg-subtle' : 'bg-brand text-white'
                }`}
              >
                {state === 'done' ? <Check className="w-3 h-3" aria-hidden="true" /> : idx + 1}
              </span>
              <span className={state === 'current' ? 'text-white font-semibold' : 'text-fg-muted'}>{st.label}</span>
              {idx < STEPS.length - 1 && <span className="w-6 h-px bg-line" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

      {step === 'document' && (
        <>
        {/* Origem do documento */}
        <div role="tablist" aria-label="Origem do documento" className="inline-flex p-1 bg-field border border-line rounded-2xl mb-4">
          {([
            { id: 'file', label: 'Arquivo', Icon: FileUp },
            { id: 'link', label: 'Link', Icon: Link2 },
          ] as const).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => {
                setTab(id);
                reset();
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                tab === id ? 'bg-raised text-white' : 'text-fg-muted hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'file' ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) readFile(file);
            }}
            className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
              isDragging ? 'border-brand bg-brand/5' : 'border-line bg-field'
            }`}
          >
            <FileUp className="w-8 h-8 text-fg-subtle mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm text-white font-semibold">Arraste o documento aqui</p>
            <p className="text-xs text-fg-muted mt-1">Word (.docx) ou texto (.txt)</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 rounded-xl bg-raised hover:bg-line border border-line text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              Escolher arquivo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.txt"
              className="sr-only"
              aria-label="Escolher arquivo do documento"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) readFile(file);
                e.target.value = '';
              }}
            />
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (link.trim()) readLink();
            }}
            className="space-y-2"
          >
            <label htmlFor="bulk-doc-link" className="text-xs font-medium text-slate-200">
              Link do Google Docs
            </label>
            <div className="flex gap-2">
              <input
                id="bulk-doc-link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://docs.google.com/document/d/..."
                className="flex-1 min-w-0 px-3 py-2.5 bg-field border border-line rounded-xl text-sm text-white"
              />
              <button
                type="submit"
                disabled={!link.trim() || isReading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand to-brand-alt text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
              >
                Ler documento
              </button>
            </div>
            <p className="text-xs text-fg-muted">O documento precisa estar compartilhado como "qualquer pessoa com o link".</p>
          </form>
        )}

        {isReading && (
          <div role="status" className="flex items-center gap-2 mt-4 text-sm text-fg-muted">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Lendo o documento...
          </div>
        )}

        {error && (
          <div role="alert" className="flex items-start gap-2 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-300">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> {error}
          </div>
        )}

        {/* Resultado da leitura */}
        {briefing && (
          <div className="mt-5 space-y-3">
            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" aria-hidden="true" />
              <div className="text-sm min-w-0">
                <p className="text-emerald-300 font-semibold">
                  {briefing.demandas.length} {briefing.demandas.length === 1 ? 'demanda encontrada' : 'demandas encontradas'} · {totalVariations} versões de comunicação
                </p>
                <p className="text-xs text-fg-muted mt-0.5 break-words">
                  {[sourceName, briefing.house, briefing.campaign].filter(Boolean).join(' · ')}
                </p>
                <p className="text-xs text-fg-muted mt-1">{byCategory.map(([name, count]) => `${name}: ${count}`).join(' · ')}</p>
              </div>
            </div>

            <ul className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-line border border-line rounded-xl bg-field">
              {briefing.demandas.map((d) => (
                <li key={d.number}>
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === d.number ? null : d.number)}
                    aria-expanded={expanded === d.number}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-raised transition-colors cursor-pointer"
                  >
                    <span className="text-sm text-white font-medium truncate">{d.title.replace(/\s{2,}/g, '  ')}</span>
                    <span className="flex items-center gap-2 shrink-0 text-xs text-fg-muted">
                      {d.variations} {d.variations === 1 ? 'versão' : 'versões'}
                      <ChevronDown className={`w-4 h-4 transition-transform ${expanded === d.number ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </span>
                  </button>
                  {expanded === d.number && (
                    <pre className="px-3 pb-3 text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{d.description}</pre>
                  )}
                </li>
              ))}
            </ul>



            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setStep('settings')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand to-brand-alt text-white text-sm font-semibold hover:opacity-95 transition-opacity cursor-pointer"
              >
                Continuar
              </button>
            </div>
          </div>
        )}
        </>
      )}

      {step === 'settings' && briefing && (
        <div className="space-y-5">
          {/* Clientes */}
          <fieldset>
            <legend className="text-xs font-medium text-slate-200 mb-2">
              Clientes <span className="text-brand">*</span>
              <span className="text-fg-muted font-normal"> — escolha um ou mais; valem para todas as tarefas</span>
            </legend>
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="search"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Buscar cliente"
                aria-label="Buscar cliente"
                className="w-full pl-9 pr-3 py-2 bg-field border border-line rounded-xl text-sm text-white"
              />
            </div>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
              {visibleClients.length === 0 && <p className="text-xs text-fg-muted py-2">Nenhum cliente encontrado.</p>}
              {visibleClients.map((c) => {
                const active = selectedClientIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="checkbox"
                    aria-checked={active}
                    onClick={() =>
                      setSelectedClientIds((prev) => (prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]))
                    }
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                      active ? 'bg-brand text-white border-brand' : 'bg-field text-slate-300 border-line hover:border-line-hover'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" aria-hidden="true" />}
                    {c.name}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Prazo */}
            <div>
              <label htmlFor="bulk-due" className="block text-xs font-medium text-slate-200 mb-1.5">
                Prazo previsto <span className="text-brand">*</span>
              </label>
              <input
                id="bulk-due"
                type="datetime-local"
                value={dueValue}
                onChange={(e) => setDueValue(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="w-full h-11 px-3 bg-field border border-line rounded-xl text-sm font-semibold text-white tabular-nums"
              />
            </div>
            {/* Coluna */}
            <div>
              <label htmlFor="bulk-status" className="block text-xs font-medium text-slate-200 mb-1.5">
                Coluna inicial
              </label>
              <select
                id="bulk-status"
                value={effectiveStatusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="w-full h-11 px-3 bg-field border border-line rounded-xl text-sm font-semibold text-white"
              >
                {spineStatuses.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Responsáveis por faixa de demandas */}
          <fieldset>
            <legend className="text-xs font-medium text-slate-200 mb-2">
              Responsáveis por faixa
              <span className="text-fg-muted font-normal"> — opcional; use o número da demanda (de {briefing.demandas[0]?.number} a {briefing.demandas[briefing.demandas.length - 1]?.number})</span>
            </legend>
            <div className="space-y-2">
              {rangeStates.map((r, idx) => {
                const covered = r.complete && !r.error ? batch.filter((d) => d.number >= r.from && d.number <= r.to).length : null;
                return (
                  <div key={r.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={r.from}
                        onChange={(e) => setRanges((prev) => prev.map((x) => (x.id === r.id ? { ...x, from: e.target.value } : x)))}
                        aria-label={`Faixa ${idx + 1}: primeira demanda`}
                        placeholder="De"
                        className="w-20 h-10 px-3 bg-field border border-line rounded-xl text-sm text-white tabular-nums"
                      />
                      <span className="text-xs text-fg-muted">a</span>
                      <input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={r.to}
                        onChange={(e) => setRanges((prev) => prev.map((x) => (x.id === r.id ? { ...x, to: e.target.value } : x)))}
                        aria-label={`Faixa ${idx + 1}: última demanda`}
                        placeholder="Até"
                        className="w-20 h-10 px-3 bg-field border border-line rounded-xl text-sm text-white tabular-nums"
                      />
                      <span className="text-xs text-fg-muted">→</span>
                      <select
                        value={r.employeeId}
                        onChange={(e) => setRanges((prev) => prev.map((x) => (x.id === r.id ? { ...x, employeeId: e.target.value } : x)))}
                        aria-label={`Faixa ${idx + 1}: designer ou videomaker`}
                        className="flex-1 min-w-[160px] h-10 px-3 bg-field border border-line rounded-xl text-sm text-white"
                      >
                        <option value="">Designer / Videomaker</option>
                        {creatives.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </select>
                      {covered !== null && <span className="text-xs text-fg-muted tabular-nums">{covered} {covered === 1 ? 'demanda' : 'demandas'}</span>}
                      {ranges.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setRanges((prev) => prev.filter((x) => x.id !== r.id))}
                          aria-label={`Remover faixa ${idx + 1}`}
                          className="p-2 text-fg-muted hover:text-white rounded-lg hover:bg-raised cursor-pointer"
                        >
                          <X className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    {r.error && <p role="alert" className="text-xs text-rose-300 mt-1">{r.error}</p>}
                  </div>
                );
              })}
              {overlapError && <p role="alert" className="text-xs text-rose-300">{overlapError}</p>}
              <button
                type="button"
                onClick={() => setRanges((prev) => [...prev, { id: nextRangeId.current++, from: '', to: '', employeeId: '' }])}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Adicionar faixa
              </button>
            </div>
          </fieldset>

          {/* Resumo */}
          <div className="p-3 rounded-xl bg-field border border-line text-sm space-y-1">
            <p className="text-white">
              <span className="font-semibold tabular-nums">{batch.length}</span> {batch.length === 1 ? 'tarefa será criada' : 'tarefas serão criadas'}
              {category ? <span className="text-fg-muted"> para {category}</span> : null}
              {toDueDate(dueValue) ? <span className="text-fg-muted"> · prazo {toDueDate(dueValue)}</span> : null}
            </p>
            {validRanges.length > 0 && (
              <p className="text-xs text-fg-muted">
                {assignedCount} com responsável · {batch.length - assignedCount} sem responsável
              </p>
            )}
            {skipped > 0 && (
              <p className="text-xs text-amber-300">
                {skipped} {skipped === 1 ? 'demanda já existe' : 'demandas já existem'} com este cliente e serão ignoradas.
              </p>
            )}
            <label className="flex items-center gap-2 text-xs text-fg-muted pt-1 cursor-pointer">
              <input type="checkbox" checked={testOnly} onChange={(e) => setTestOnly(e.target.checked)} />
              Criar só as 2 primeiras, como teste
            </label>
          </div>

          {isCreating && (
            <div role="status" className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-fg-muted">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Criando tarefas... {progress.done} de {progress.total}
              </div>
              <div className="h-1.5 bg-raised rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand to-brand-alt transition-all"
                  style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setStep('document')}
              disabled={isCreating}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-raised hover:bg-line border border-line transition-colors disabled:opacity-50 cursor-pointer"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={createTasks}
              disabled={!canCreate || isCreating}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand to-brand-alt text-white text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {batch.length > 0 ? `Criar ${batch.length} ${batch.length === 1 ? 'tarefa' : 'tarefas'}` : 'Criar tarefas'}
            </button>
          </div>
        </div>
      )}

      {step === 'result' && outcome && (
        <div className="space-y-4">
          <div
            role="status"
            className={`flex items-start gap-2 p-4 rounded-xl border ${
              outcome.failed > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
            }`}
          >
            {outcome.failed > 0 ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" aria-hidden="true" />
            )}
            <div className="text-sm">
              <p className="text-white font-semibold">
                {outcome.createdIds.length > 0
                  ? `${outcome.createdIds.length} ${outcome.createdIds.length === 1 ? 'tarefa criada' : 'tarefas criadas'}`
                  : 'Nenhuma tarefa no quadro'}
              </p>
              {outcome.failed > 0 && <p className="text-amber-300 mt-0.5">{outcome.failed} não puderam ser salvas. Tente importar de novo: as que já existem serão ignoradas.</p>}
              {outcome.skipped > 0 && <p className="text-fg-muted mt-0.5">{outcome.skipped} já existiam e foram ignoradas.</p>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={undoImport}
              disabled={outcome.createdIds.length === 0 || isUndoing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors disabled:opacity-40 cursor-pointer"
            >
              {isUndoing ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Undo2 className="w-4 h-4" aria-hidden="true" />}
              Desfazer importação
            </button>
            <button
              type="button"
              onClick={close}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand to-brand-alt text-white text-sm font-semibold hover:opacity-95 transition-opacity cursor-pointer"
            >
              Concluir
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
