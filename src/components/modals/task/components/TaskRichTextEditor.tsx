import React from 'react';
import {
  Heading1,
  Type,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
} from 'lucide-react';

export const markdownToHtml = (md: string = ''): string => {
  if (!md) return '';
  let html = md;

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-800 text-slate-100 p-3 rounded-xl text-xs font-mono my-2 overflow-x-auto">$1</pre>');
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-extrabold text-slate-900 dark:text-white mt-3 mb-1">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-base font-extrabold text-slate-900 dark:text-white mt-4 mb-1.5">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-lg font-black text-slate-900 dark:text-white mt-4 mb-2">$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*\*([^*]+?)\*\*\*/g, '<b><i>$1</i></b>');
  html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong class="font-black text-slate-900 dark:text-white">$1</strong>');
  html = html.replace(/\*([^*]+?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/~~(.*?)~~/g, '<strike class="line-through text-slate-400">$1</strike>');

  // Images & Links
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%; border-radius: 12px; margin: 8px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />');
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-sky-400 hover:text-sky-300 font-bold underline break-all">$1</a>');

  // Autolink plain URLs (http, https, or www) that are not already inside an HTML tag attribute or link
  // Matches URLs separated by whitespace or start/end of line
  html = html.replace(/(^|[\s>(])((?:https?:\/\/|www\.)[^\s<)]+)/gi, (match, prefix, url) => {
    // Avoid double linking if preceded by href=" or src="
    const href = url.startsWith('http') ? url : `https://${url}`;
    return `${prefix}<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-sky-400 hover:text-sky-300 font-bold underline break-all">${url}</a>`;
  });

  // Bullet lists (- item or * item)
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<div class="flex items-start gap-2 my-0.5"><span class="text-indigo-500 font-bold">•</span><span>$1</span></div>');

  // Line breaks to <br />
  html = html.replace(/\n/g, '<br />');

  return html;
};

export const htmlToMarkdown = (html: string = ''): string => {
  if (!html) return '';
  let md = html;

  md = md.replace(/<br\s*[\/]?>/gi, '\n');
  md = md.replace(/<div>/gi, '\n').replace(/<\/div>/gi, '');
  md = md.replace(/<p>/gi, '').replace(/<\/p>/gi, '\n');

  md = md.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n');
  md = md.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n');
  md = md.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n');

  md = md.replace(/<b><i>(.*?)<\/i><\/b>/gi, '***$1***');
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<strike>(.*?)<\/strike>/gi, '~~$1~~');
  md = md.replace(/<del>(.*?)<\/del>/gi, '~~$1~~');

  md = md.replace(/<a\s+[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  md = md.replace(/<img\s+[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
  md = md.replace(/<img\s+[^>]*src="([^"]*)"[^>]*\/?>/gi, '![Imagem]($1)');

  md = md.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<ul>/gi, '').replace(/<\/ul>/gi, '');
  md = md.replace(/<ol>/gi, '').replace(/<\/ol>/gi, '');

  md = md.replace(/<[^>]+>/g, '');

  return md.trim();
};

export const TaskRichTextEditor: React.FC<{
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isInternalChange = React.useRef(false);

  React.useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      editorRef.current.innerHTML = markdownToHtml(value);
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      const html = editorRef.current.innerHTML;
      const md = htmlToMarkdown(html);
      onChange(md);
    }
  };

  const exec = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    handleInput();
  };

  const toggleCase = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const selectedText = selection.toString();
    if (!selectedText) return;

    const isUpper = selectedText === selectedText.toUpperCase();
    const newText = isUpper ? selectedText.toLowerCase() : selectedText.toUpperCase();

    document.execCommand('insertText', false, newText);
    handleInput();
  };

  const addLink = () => {
    const url = prompt('Digite a URL do link:');
    if (url) exec('createLink', url);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          exec('insertImage', result);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const addImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-[#2E2E2E] focus-within:border-[#E4007E] transition-all bg-[#1C1C1C]">
      {/* Hidden File Input for Local Images */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />
      <div className="flex items-center flex-wrap gap-1 p-2 bg-[#181818] border-b border-[#2E2E2E] text-slate-200 select-none">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec('formatBlock', '<h1>');
          }}
          className="p-1.5 hover:bg-[#282828] hover:text-[#E4007E] rounded-lg font-bold text-xs transition-colors flex items-center gap-0.5"
          title="Título H1"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleCase();
          }}
          className="px-2 py-1 hover:bg-[#282828] hover:text-[#E4007E] rounded-lg font-bold text-xs transition-colors flex items-center gap-0.5 bg-[#222222]"
          title="Alternar MAIÚSCULO / Normal"
        >
          <Type className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black">Tt</span>
        </button>

        <div className="h-4 w-px bg-[#2E2E2E] mx-0.5" />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec('bold');
          }}
          className="p-1.5 hover:bg-[#282828] hover:text-[#E4007E] rounded-lg font-bold text-xs transition-colors"
          title="Negrito"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec('italic');
          }}
          className="p-1.5 hover:bg-[#282828] hover:text-[#E4007E] rounded-lg font-bold text-xs transition-colors"
          title="Itálico"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec('strikeThrough');
          }}
          className="p-1.5 hover:bg-[#282828] hover:text-[#E4007E] rounded-lg font-bold text-xs transition-colors"
          title="Tachado"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-[#2E2E2E] mx-0.5" />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec('insertUnorderedList');
          }}
          className="p-1.5 hover:bg-[#282828] hover:text-[#E4007E] rounded-lg font-bold text-xs transition-colors"
          title="Lista com Marcadores"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec('insertOrderedList');
          }}
          className="p-1.5 hover:bg-[#282828] hover:text-[#E4007E] rounded-lg font-bold text-xs transition-colors"
          title="Lista Numerada"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-[#2E2E2E] mx-0.5" />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            addLink();
          }}
          className="p-1.5 hover:bg-[#282828] hover:text-[#E4007E] rounded-lg font-bold text-xs transition-colors"
          title="Inserir Link"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            addImage();
          }}
          className="p-1.5 hover:bg-[#282828] rounded-lg font-bold text-xs transition-colors flex items-center gap-1 text-[#E4007E]"
          title="Anexar Imagem do Seu Computador"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">Imagem</span>
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec('formatBlock', '<pre>');
          }}
          className="p-1.5 hover:bg-[#282828] hover:text-[#E4007E] rounded-lg font-bold text-xs transition-colors"
          title="Bloco de Código"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editable Canvas */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="w-full min-h-[140px] max-h-[300px] overflow-y-auto p-3 text-xs text-white focus:outline-none leading-relaxed bg-[#1C1C1C]"
        data-placeholder={placeholder || 'Escreva a descrição da tarefa...'}
      />
    </div>
  );
};
