// API imperativa para diálogos do sistema (substitui window.confirm / alert / prompt).
// Uso: `if (await confirmDialog({ message: 'Excluir?', tone: 'danger' })) { ... }`
// O componente <DialogHost /> (montado uma vez no App) renderiza e resolve as promessas.

export type DialogKind = 'confirm' | 'alert' | 'prompt';

export interface DialogRequest {
  id: number;
  kind: DialogKind;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  defaultValue?: string;
  resolve: (value: unknown) => void;
}

type Listener = (request: DialogRequest) => void;

let listener: Listener | null = null;
let nextId = 1;

export const registerDialogHost = (fn: Listener | null) => {
  listener = fn;
};

const open = <T,>(request: Omit<DialogRequest, 'id' | 'resolve'>, fallback: () => T): Promise<T> =>
  new Promise<T>((resolve) => {
    if (!listener) {
      // Sem host montado (ex.: testes): cai no comportamento nativo
      resolve(fallback());
      return;
    }
    listener({ ...request, id: nextId++, resolve: resolve as (value: unknown) => void });
  });

export const confirmDialog = (opts: { message: string; title?: string; confirmLabel?: string; cancelLabel?: string; tone?: 'default' | 'danger' }) =>
  open<boolean>({ kind: 'confirm', ...opts }, () => window.confirm(opts.message));

export const alertDialog = (message: string, title = 'Atenção') =>
  open<void>({ kind: 'alert', message, title, confirmLabel: 'Entendi' }, () => window.alert(message));

export const promptDialog = (opts: { message: string; title?: string; defaultValue?: string; confirmLabel?: string }) =>
  open<string | null>({ kind: 'prompt', ...opts }, () => window.prompt(opts.message, opts.defaultValue));
