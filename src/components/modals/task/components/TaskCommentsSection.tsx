import React from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { TaskComment } from '../../../../types';

export const TaskCommentsSection: React.FC<{
  comments: TaskComment[];
  newCommentText: string;
  setNewCommentText: React.Dispatch<React.SetStateAction<string>>;
  isPostingComment: boolean;
  onAddComment: (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  currentUser: any;
}> = ({
  comments,
  newCommentText,
  setNewCommentText,
  isPostingComment,
  onAddComment,
  onDeleteComment,
  currentUser,
}) => {
  return (
    <div className="pt-5 border-t border-[#262626] space-y-4 relative z-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#E4007E]" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Comentários ({comments.length})
          </h3>
        </div>
      </div>

      {/* New Comment Form */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <textarea
            rows={2}
            placeholder="Escreva um comentário..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                onAddComment(e);
              }
            }}
            className="flex-1 p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:border-[#E4007E]"
          />
          <button
            type="button"
            disabled={isPostingComment || !newCommentText.trim()}
            onClick={onAddComment}
            className="px-4 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 self-end py-3 shadow-md shadow-[#E4007E]/25 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isPostingComment ? 'Enviando...' : 'Enviar'}</span>
          </button>
        </div>

        {/* Comments Feed */}
        {comments.length === 0 ? (
          <div className="p-4 bg-[#1C1C1C]/50 border border-dashed border-[#2E2E2E] rounded-xl text-center text-xs text-slate-400 font-medium">
            Nenhum comentário nesta demanda ainda.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {(() => {
              const sortedComments = [...comments].sort((a, b) => {
                const timeA = a.date ? new Date(a.date).getTime() : 0;
                const timeB = b.date ? new Date(b.date).getTime() : 0;
                if (!isNaN(timeA) && !isNaN(timeB) && timeA > 0 && timeB > 0 && timeA !== timeB) {
                  return timeB - timeA;
                }
                return 0;
              });

              return sortedComments.map((comment) => {
                const canDelete =
                  currentUser?.role === 'admin' ||
                  (currentUser?.name &&
                    (comment.authorName?.toLowerCase().trim() === currentUser.name.toLowerCase().trim() ||
                      comment.authorName?.toLowerCase().includes(currentUser.name.toLowerCase().trim()) ||
                      currentUser.name.toLowerCase().includes(comment.authorName?.toLowerCase().trim() || '')));

                return (
                  <div
                    key={comment.id}
                    className="p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl space-y-1 group relative hover:border-[#E4007E]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-[#E4007E]">
                        <div className="w-5 h-5 rounded-full bg-[#2E2E2E] text-white flex items-center justify-center text-[10px]">
                          {comment.authorInitials}
                        </div>
                        <span>{comment.authorName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">
                          {comment.date && comment.date.includes('T')
                            ? comment.date.split('T')[0].split('-').reverse().join('/')
                            : comment.date}
                        </span>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDeleteComment(comment.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                            title="Excluir este comentário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-100 pl-7 leading-relaxed font-normal">
                      {comment.text}
                    </p>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
