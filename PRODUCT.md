# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Designers e videomakers da agência RioSãoPaulo, que executam demandas criativas e abrem o sistema em "minhas tarefas"; e gestores / social media, que criam demandas, cobram prazos e acompanham entregas. Administradores usam dashboard, relatórios e cadastros.

## Product Purpose
Sistema interno de gestão de demandas criativas em formato kanban para a agência RioSãoPaulo, inspirado em Trello, ClickUp e Linear. Sucesso é a equipe saber o que fazer, para quem e até quando, com entregas e aprovações rastreadas.

## Positioning
Feito sob medida para os clientes da agência: demandas organizadas por cliente/marca, material auxiliar de clientes (paleta de cores copiável), acessos centralizados e pastas do Google Drive vinculadas a cada demanda.

## Operating Context
Uso diário por uma equipe pequena, com sessão que expira à 00:00. Dados no Supabase (PostgreSQL + Realtime); arquivos no Google Drive; sincronização bidirecional com o Trello. Módulos: kanban com gaveta lateral de tarefa, dashboard, cadastros de clientes e funcionários, sprints, relatórios, paleta de comandos (Cmd+K), notificações em tempo real, histórico de atividade por tarefa e filtros persistentes.

## Capabilities and Constraints
Stack: React, TypeScript, Vite, Tailwind CSS, Lucide React. Interface somente em português (pt-BR) e em tema escuro. Próximas iterações: microinterações, atalhos estilo Linear, skeleton loaders, fluxo de aprovação (V1 vs V2, selos), métricas de produtividade (workload por designer, lead time), automações e webhooks. Não decidido: requisito formal de acessibilidade.

## Brand Commitments
Identidade da agência: degradê Rosa Pantone 213C (#E4007E) para Laranja Pantone 1655C (#E94E18); fundos escuros #101010/#141414/#181818, bordas #262626/#2E2E2E, texto branco.

## Evidence on Hand
Código existente em src/ e guia visual em galera-bet-design-system.md. Não há depoimentos, métricas de uso nem dados de clientes reais para citar.

## Product Principles
- Velocidade e clareza antes de decoração: é ferramenta de trabalho diário.
- Cada demanda leva seu contexto junto: cliente, arquivos, comentários e histórico.
- A equipe vê a mesma realidade em tempo real.
- A identidade rosa-laranja da agência aparece nos detalhes, não em excesso.
