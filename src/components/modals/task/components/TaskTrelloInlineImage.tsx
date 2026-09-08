import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, ExternalLink } from 'lucide-react';
import { TrelloAttachment } from '../../../../types';

export const TaskTrelloInlineImage: React.FC<{
  rawUrl: string;
  alt: string;
  apiKey?: string;
  serverToken?: string;
  attachments?: TrelloAttachment[];
}> = ({ rawUrl, alt, apiKey, serverToken, attachments }) => {
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const loadTrelloImage = async () => {
      setLoading(true);
      setHasError(false);

      let cleanUrl = rawUrl.replace(/\\_/g, '_').trim();
      if (cleanUrl.endsWith(')')) cleanUrl = cleanUrl.slice(0, -1);

      const cardAttMatch = cleanUrl.match(/\/cards\/([a-f0-9]{24})\/attachments\/([a-f0-9]{24})/i);

      if (cardAttMatch && apiKey && serverToken) {
        const cardId = cardAttMatch[1];
        const attId = cardAttMatch[2];

        try {
          const attRes = await fetch(
            `https://api.trello.com/1/cards/${cardId}/attachments/${attId}?key=${apiKey}&token=${serverToken}`
          );
          if (attRes.ok) {
            const attData = await attRes.json();
            let cdnUrl = '';
            if (attData.previews && attData.previews.length > 0) {
              cdnUrl = attData.previews[attData.previews.length - 1].url;
            } else if (attData.url) {
              cdnUrl = attData.url;
            }

            if (cdnUrl && isMounted) {
              try {
                const bRes = await fetch(cdnUrl);
                if (bRes.ok) {
                  const blob = await bRes.blob();
                  const objectUrl = URL.createObjectURL(blob);
                  if (isMounted) {
                    setBlobUrl(objectUrl);
                    setLoading(false);
                    return;
                  }
                }
              } catch (e) {
                if (isMounted) {
                  setBlobUrl(cdnUrl);
                  setLoading(false);
                  return;
                }
              }
            }
          }
        } catch (e) {
          console.warn('Trello attachment API lookup error:', e);
        }
      }

      const attIdMatch = cleanUrl.match(/\/attachments\/([a-f0-9]{24})\//i);
      const attId = attIdMatch ? attIdMatch[1] : null;

      if (attachments && attachments.length > 0) {
        const found = attachments.find(
          (a) => (attId && a.id === attId) || cleanUrl.includes(a.id)
        );
        if (found && found.previews && found.previews.length > 0) {
          cleanUrl = found.previews[found.previews.length - 1].url;
        } else if (found && found.url) {
          cleanUrl = found.url;
        }
      }

      if (apiKey && serverToken) {
        if (!cleanUrl.includes('key=')) {
          const sep = cleanUrl.includes('?') ? '&' : '?';
          cleanUrl = `${cleanUrl}${sep}key=${apiKey}&token=${serverToken}`;
        }
      }

      let proxiedUrl = cleanUrl.replace('https://trello.com/1/', 'https://api.trello.com/1/');
      if (proxiedUrl.startsWith('https://api.trello.com/')) {
        proxiedUrl = proxiedUrl.replace('https://api.trello.com/', '/trello-api/');
      }

      try {
        const response = await fetch(proxiedUrl);
        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          if (isMounted) {
            setBlobUrl(objectUrl);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Blob fetch failed, falling back to direct cleanUrl:', err);
      }

      if (isMounted) {
        setBlobUrl(proxiedUrl);
        setLoading(false);
      }
    };

    loadTrelloImage();

    return () => {
      isMounted = false;
    };
  }, [rawUrl, apiKey, serverToken, attachments]);

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/5 shadow-xs p-2 space-y-2 group">
      {loading ? (
        <div className="w-full h-56 bg-slate-100 animate-pulse rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 text-xs font-semibold">
          <ImageIcon className="w-6 h-6 animate-bounce text-indigo-500" />
          <span>Carregando imagem do Trello...</span>
        </div>
      ) : hasError ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center justify-between">
          <span>Não foi possível carregar a imagem.</span>
          <a href={blobUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline">
            Abrir Link
          </a>
        </div>
      ) : (
        <img
          src={blobUrl}
          alt={alt}
          className="w-full max-h-[480px] object-contain rounded-xl bg-white shadow-2xs group-hover:scale-[1.005] transition-transform duration-200"
          onError={() => setHasError(true)}
        />
      )}

      <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-500">
        <span className="font-semibold text-slate-700 truncate">{alt}</span>
        {blobUrl && (
          <a
            href={blobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 font-bold hover:underline flex items-center gap-1 shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir em Alta Resolução</span>
          </a>
        )}
      </div>
    </div>
  );
};
