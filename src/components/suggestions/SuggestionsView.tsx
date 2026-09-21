import React, { useState, useEffect } from 'react';
import { Lightbulb, CheckCircle2, Circle, Trash2, Plus, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SystemSuggestion } from '../../types';
import { useApp } from '../../context/AppContext';
import { Button, Input } from '../ui';

export const SuggestionsView: React.FC = () => {
  const { currentUser, addToast } = useApp();
  const [suggestions, setSuggestions] = useState<SystemSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('system_suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (err: any) {
      addToast('Erro ao buscar sugestões', err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('system_suggestions')
        .insert([{
          title: newTitle.trim(),
          status: 'pending',
          created_by: currentUser?.id
        }])
        .select();

      if (error) throw error;
      
      addToast('Sugestão adicionada com sucesso!', undefined, 'success');
      setNewTitle('');
      if (data) {
        setSuggestions([data[0], ...suggestions]);
      }
    } catch (err: any) {
      addToast('Erro ao adicionar sugestão', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (suggestion: SystemSuggestion) => {
    const newStatus = suggestion.status === 'pending' ? 'completed' : 'pending';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

    try {
      const { error } = await supabase
        .from('system_suggestions')
        .update({ status: newStatus, completed_at: completedAt })
        .eq('id', suggestion.id);

      if (error) throw error;

      setSuggestions(suggestions.map(s => 
        s.id === suggestion.id 
          ? { ...s, status: newStatus, completed_at: completedAt }
          : s
      ));
      
      if (newStatus === 'completed') {
        addToast('Sugestão marcada como concluída!', undefined, 'success');
      }
    } catch (err: any) {
      addToast('Erro ao atualizar sugestão', err.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta sugestão?')) return;
    
    try {
      const { error } = await supabase
        .from('system_suggestions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuggestions(suggestions.filter(s => s.id !== id));
      addToast('Sugestão removida.', undefined, 'success');
    } catch (err: any) {
      addToast('Erro ao remover sugestão', err.message, 'error');
    }
  };

  const pending = suggestions.filter(s => s.status === 'pending');
  const completed = suggestions.filter(s => s.status === 'completed');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Sugestões de Melhorias</h1>
            <p className="text-sm font-medium text-slate-400">
              Checklist de ideias e melhorias sugeridas pelos gestores.
            </p>
          </div>
        </div>
      </div>

      {/* Form de Adicionar */}
      <div className="bg-[#151515] border border-[#222] p-5 rounded-2xl shadow-xl mb-8">
        <form onSubmit={handleAdd} className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Descreva uma nova sugestão ou melhoria para o sistema..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              disabled={isSubmitting}
              className="bg-[#1C1C1C] border-[#2E2E2E]"
            />
          </div>
          <Button 
            type="submit" 
            disabled={!newTitle.trim() || isSubmitting}
            className="gap-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white border-none shadow-lg shadow-yellow-600/20"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10">
          <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pendentes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-semibold text-white tracking-tight">
                Pendentes ({pending.length})
              </h2>
            </div>
            
            {pending.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-[#222] rounded-2xl text-slate-500 font-medium">
                Nenhuma sugestão pendente no momento.
              </div>
            ) : (
              <div className="grid gap-2">
                {pending.map(suggestion => (
                  <div 
                    key={suggestion.id}
                    className="flex items-center gap-4 bg-[#151515] border border-[#222] p-4 rounded-xl hover:border-amber-500/30 transition-colors group"
                  >
                    <button 
                      onClick={() => handleToggle(suggestion)}
                      className="text-slate-500 hover:text-amber-500 transition-colors flex-shrink-0"
                    >
                      <Circle className="w-6 h-6" />
                    </button>
                    <span className="flex-1 text-slate-200 font-medium">{suggestion.title}</span>
                    <button
                      onClick={() => handleDelete(suggestion.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-2"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Concluídas */}
          {completed.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-[#222]">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h2 className="text-base font-semibold text-white tracking-tight">
                  Concluídas ({completed.length})
                </h2>
              </div>
              
              <div className="grid gap-2 opacity-60">
                {completed.map(suggestion => (
                  <div 
                    key={suggestion.id}
                    className="flex items-center gap-4 bg-[#151515] border border-[#222] p-4 rounded-xl"
                  >
                    <button 
                      onClick={() => handleToggle(suggestion)}
                      className="text-emerald-500 hover:text-slate-400 transition-colors flex-shrink-0"
                    >
                      <CheckCircle2 className="w-6 h-6" />
                    </button>
                    <span className="flex-1 text-slate-400 font-medium line-through">{suggestion.title}</span>
                    <button
                      onClick={() => handleDelete(suggestion.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors p-2"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
