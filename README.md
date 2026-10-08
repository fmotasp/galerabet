# RioSãoPaulo — Gestão de Demandas

Sistema interno da agência RioSãoPaulo: kanban de demandas criativas por cliente, dashboard, relatórios, cadastros,
acessos, materiais de cliente e arquivos no Google Drive. React + TypeScript + Vite + Tailwind 4, dados no Supabase.

## Rodar localmente
```bash
npm install
cp .env.example .env   # opcional: aponta para outro projeto Supabase
npm run dev            # http://localhost:3000
```

## Scripts
| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção em `dist/` |
| `npm test` | Testes (Vitest) |
| `npm run lint` | Checagem de tipos (`tsc --noEmit`) |
| `npm run rsp` | Commit + push para o GitHub (`rsp.sh`) |

## Estrutura
- `src/components/` telas por módulo (tasks, dashboard, reports, ...), `ui/` componentes base
- `src/context/` e `src/store/` estado global · `src/lib/` utilitários e integrações (Drive, Supabase)
- `supabase/functions/` Edge Functions · `supabase/migrations/` e `supabase_*.sql` migrações do banco
- `scripts/legacy/` scripts pontuais já aplicados (histórico; não fazem parte do app)
- `DESIGN.md` tokens de cor e regras visuais · `PRODUCT.md` contexto de produto

## Edge Functions
`drive-proxy` e `upload-to-drive` exigem usuário autenticado. Defina nos secrets: `GOOGLE_SERVICE_ACCOUNT` e
`ALLOWED_ORIGINS` (origens do CORS). Deploy: `supabase functions deploy <nome>`.
