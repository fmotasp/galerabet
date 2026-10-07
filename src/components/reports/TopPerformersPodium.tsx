import React from 'react';
import { Trophy, Star, TrendingUp } from 'lucide-react';

export const TopPerformersPodium: React.FC<{
  members: any[];
}> = ({ members }) => {
  // Pega os top 3 com mais tarefas concluídas
  const topMembers = [...members]
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 3);

  if (topMembers.length < 3) return null;

  // Reordena para o pódio: 2º lugar (esq), 1º lugar (centro), 3º lugar (dir)
  const podium = [topMembers[1], topMembers[0], topMembers[2]];

  return (
    <div className="w-full p-6 bg-[#141414] border border-[#262626] rounded-2xl flex flex-col shadow-xs mb-6 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-32 bg-[#E4007E]/10 blur-[80px] pointer-events-none" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-bold text-white tracking-tight">Top Performers da Semana</h2>
        </div>
        <div className="px-3 py-1 bg-[#1C1C1C] border border-[#262626] rounded-full text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-yellow-500" />
          Mural de Destaques
        </div>
      </div>

      <div className="flex items-end justify-center gap-4 sm:gap-8 lg:gap-12 h-64 relative z-10 pb-4">
        {podium.map((member, index) => {
          if (!member) return null;
          
          const isFirst = index === 1;
          const isSecond = index === 0;
          const isThird = index === 2;

          let rankColor = '';
          let rankText = '';
          let height = '';
          let glow = '';

          if (isFirst) {
            rankColor = 'from-yellow-400 to-yellow-600 text-yellow-900 ring-yellow-500/50';
            rankText = '1º LUGAR';
            height = 'h-36 sm:h-44';
            glow = 'shadow-[0_0_30px_rgba(234,179,8,0.15)] border-yellow-500/30';
          } else if (isSecond) {
            rankColor = 'from-slate-300 to-slate-400 text-slate-900 ring-slate-400/50';
            rankText = '2º LUGAR';
            height = 'h-28 sm:h-32';
            glow = 'border-slate-400/20';
          } else {
            rankColor = 'from-amber-700 to-amber-800 text-amber-100 ring-amber-700/50';
            rankText = '3º LUGAR';
            height = 'h-24 sm:h-28';
            glow = 'border-amber-700/20';
          }

          return (
            <div key={member.id} className="flex flex-col items-center group">
              {/* Avatar Flutuante com Coroa para o 1º */}
              <div className="relative mb-3 flex flex-col items-center transition-transform duration-300 group-hover:-translate-y-2">
                {isFirst && (
                  <div className="absolute -top-6 text-yellow-500 animate-bounce">
                    <Trophy className="w-6 h-6" />
                  </div>
                )}
                
                <div className={`relative rounded-full p-1 bg-gradient-to-br ${rankColor} ring-4 ${isFirst ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-12 h-12 sm:w-16 sm:h-16'}`}>
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="w-full h-full rounded-full object-cover border-2 border-[#141414]" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#1A1A1A] border-2 border-[#141414] flex items-center justify-center font-bold text-lg text-white">
                      {member.initials}
                    </div>
                  )}
                </div>

                {/* Badge de Pontos */}
                <div className="absolute -bottom-2 bg-[#1C1C1C] border border-[#262626] rounded-full px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  {member.completed} entregas
                </div>
              </div>

              {/* Nome */}
              <span className={`font-bold text-center mt-2 max-w-[100px] truncate ${isFirst ? 'text-white text-sm sm:text-base' : 'text-slate-300 text-xs sm:text-sm'}`}>
                {member.name.split(' ')[0]}
              </span>

              {/* Pedestal */}
              <div className={`w-20 sm:w-28 mt-4 rounded-t-xl flex flex-col items-center justify-start pt-3 bg-gradient-to-b from-[#1C1C1C] to-[#101010] border-t border-l border-r ${glow} ${height}`}>
                <span className={`text-[10px] sm:text-xs font-black tracking-widest bg-gradient-to-br ${rankColor} bg-clip-text text-transparent`}>
                  {rankText}
                </span>
                {isFirst && (
                  <div className="mt-2 text-3xl font-black text-white/5">1</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
