import fs from 'fs';

const filePath = 'src/components/reports/ReportsView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the inner content with direct SVG <text> elements or perfectly centered text inside the SVG
// Using direct SVG <text> ensures 100% vector alignment, exactly like the reference image: "New Lead (230)"
// centered horizontally and vertically inside the SVG shape!

const oldInnerBlock = `<div className="relative w-full h-11 flex items-center justify-center">
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
                    </div>`;

const newInnerBlock = `<div className="relative w-full h-12 flex items-center justify-center">
                      <svg
                        className="w-full h-full overflow-visible transition-all duration-300 drop-shadow-sm group-hover:drop-shadow-[0_4px_16px_rgba(228,0,126,0.3)]"
                        viewBox="0 0 400 48"
                      >
                        <defs>
                          <linearGradient id={\`grad-\${st.id}\`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={stageColor} stopOpacity="0.95" />
                            <stop offset="100%" stopColor={stageColor} stopOpacity="0.80" />
                          </linearGradient>
                        </defs>
                        <polygon
                          points={\`\${(400 * (100 - topPct)) / 200},0 \${400 - (400 * (100 - topPct)) / 200},0 \${400 - (400 * (100 - bottomPct)) / 200},48 \${(400 * (100 - bottomPct)) / 200},48\`}
                          fill={\`url(#grad-\${st.id})\`}
                          stroke="rgba(255,255,255,0.22)"
                          strokeWidth="1"
                          className="transition-all duration-300 group-hover:brightness-110"
                        />
                        {/* Texto nativo dentro do próprio SVG (exatamente como na referência) */}
                        <text
                          x="200"
                          y="27"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          fontSize="13"
                          fontWeight="700"
                          letterSpacing="0.3"
                          style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.6))', pointerEvents: 'none' }}
                        >
                          {\`\${st.label} (\${st.count})\`}
                        </text>
                      </svg>
                    </div>`;

if (!content.includes('SVG Trapezoid Segment')) {
  console.error("Marker not found");
  process.exit(1);
}

content = content.replace(oldInnerBlock, newInnerBlock);
fs.writeFileSync(filePath, content);
console.log("SVG centered text applied successfully!");
