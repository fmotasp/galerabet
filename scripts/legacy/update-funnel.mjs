import fs from 'fs';

const filePath = 'src/components/reports/ReportsView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Let's create an SVG / trapezoid funnel generator
// We want an inverted pyramid trapezoid funnel with smooth gaps, interactive hover, glow, stage label and count, and percentages.
// Also a clean list or legend below or side-by-side if helpful.

const oldBlockStart = `{/* Funil de Produção - Segmented Flow Bar */}`;
const newBlock = `{/* Funil de Produção - Estilo Trapézio Invertido 3D / Flat Impeccable */}
        <div className="p-6 bg-[#141414] border border-[#262626] rounded-2xl flex flex-col justify-between">
          <div className="space-y-1 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#E4007E]" />
                <h2 className="text-base font-semibold text-white tracking-tight">Funil de Produção</h2>
              </div>
              <span className="text-xs font-semibold text-slate-400 tabular-nums">
                {metrics.total} demandas no fluxo
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Taxa de progressão e volume acumulado por estágio da esteira.
            </p>
          </div>

          {/* Gráfico de Trapézio Invertido (Visual Sales/Pipeline Funnel) */}
          <div className="flex flex-col items-center justify-center my-auto py-2">
            <div className="w-full max-w-[460px] flex flex-col gap-1.5">
              {statusFunnel.map((st, index) => {
                const totalStages = statusFunnel.length;
                // Calculate trapezoid slope (narrowing down)
                // Top width starts near 100%, bottom tapers to ~46%
                const topPct = 100 - (index * (54 / Math.max(totalStages, 1)));
                const bottomPct = 100 - ((index + 1) * (54 / Math.max(totalStages, 1)));
                
                // Color palette fallback if dotColor isn't custom
                const palette = [
                  '#3B82F6', // Blue
                  '#06B6D4', // Cyan
                  '#10B981', // Emerald
                  '#F59E0B', // Amber
                  '#F97316', // Orange
                  '#EC4899', // Pink
                  '#E4007E', // Magenta Brand
                  '#8B5CF6', // Purple
                ];
                const stageColor = st.dotColor && st.dotColor !== '#E4007E' ? st.dotColor : palette[index % palette.length];

                return (
                  <div
                    key={st.id}
                    className="relative group transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                    title={\`\${st.label}: \${st.count} demandas (\${st.percentage}% do fluxo)\`}
                  >
                    {/* SVG Trapezoid Segment */}
                    <div className="relative w-full h-11 flex items-center justify-center">
                      <svg
                        className="absolute inset-0 w-full h-full overflow-visible transition-all duration-300 drop-shadow-sm group-hover:drop-shadow-[0_4px_12px_rgba(228,0,126,0.25)]"
                        preserveAspectRatio="none"
                        viewBox="0 0 100 40"
                      >
                        <defs>
                          <linearGradient id={\`grad-\${st.id}\`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={stageColor} stopOpacity="0.88" />
                            <stop offset="100%" stopColor={stageColor} stopOpacity="0.65" />
                          </linearGradient>
                        </defs>
                        <polygon
                          points={\`\${(100 - topPct) / 2},0 \${100 - (100 - topPct) / 2},0 \${100 - (100 - bottomPct) / 2},40 \${(100 - bottomPct) / 2},40\`}
                          fill={\`url(#grad-\${st.id})\`}
                          stroke="rgba(255,255,255,0.18)"
                          strokeWidth="0.75"
                          className="transition-all duration-300 group-hover:brightness-110"
                        />
                      </svg>

                      {/* Content inside trapezoid */}
                      <div className="relative z-10 flex items-center justify-between w-full px-5 text-white pointer-events-none">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2 h-2 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: '#ffffff' }} />
                          <span className="text-xs font-bold tracking-wide drop-shadow-md truncate text-white">
                            {st.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-black drop-shadow-md tabular-nums text-white bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-xs border border-white/10">
                            {st.count}
                          </span>
                          <span className="text-[10px] font-bold text-white/80 tabular-nums drop-shadow-xs">
                            {st.percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics Footer */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E4007E]" />
              Topo ao Fundo: Fluxo Contínuo
            </span>
            <span className="tabular-nums font-semibold text-slate-300">
              Taxa de Conversão Final: {statusFunnel.length > 0 ? \`\${statusFunnel[statusFunnel.length - 1].percentage}%\` : '0%'}
            </span>
          </div>
        </div>`;

// Find the section and replace it
const startIdx = content.indexOf('{/* Funil de Produção - Segmented Flow Bar */}');
if (startIdx === -1) {
  console.error("Could not find start index");
  process.exit(1);
}

// Find end of this specific div (before {/* Tempo Médio de Ciclo )
const endIdx = content.indexOf('{/* Tempo Médio de Ciclo (Cycle Time & Gargalos) */}');
if (endIdx === -1) {
  console.error("Could not find end index");
  process.exit(1);
}

const before = content.substring(0, startIdx);
const after = content.substring(endIdx);

fs.writeFileSync(filePath, before + newBlock + '\n\n        ' + after);
console.log("Updated funnel block successfully!");
