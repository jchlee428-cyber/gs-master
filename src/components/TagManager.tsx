import React, { useState } from 'react';
import { Tag, X, Plus } from 'lucide-react';

interface TagManagerProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export function TagManager({ tags = [], onAddTag, onRemoveTag }: TagManagerProps) {
  const [newTag, setNewTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTag.trim();
    if (tag && !tags.includes(tag)) {
      onAddTag(tag);
    }
    setNewTag('');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col gap-2 bg-white p-4 rounded-xl shadow-sm border border-stone-200">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
          <Tag size={16} className="text-stone-400" />
          본문 주제 태그
        </h4>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md transition-colors"
          >
            <Plus size={12} /> 추가
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center min-h-[28px]">
        {tags.length === 0 && !isAdding && (
          <span className="text-xs text-stone-400 italic">추가된 태그가 없습니다.</span>
        )}
        
        {tags.map(tag => (
          <span 
            key={tag} 
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200"
          >
            {tag}
            <button 
              onClick={() => onRemoveTag(tag)}
              className="text-stone-400 hover:text-rose-500 focus:outline-none transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {isAdding && (
          <form onSubmit={handleSubmit} className="inline-flex items-center">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="태그 입력..."
              className="text-xs px-2.5 py-1 w-24 rounded-l-full border-y border-l border-stone-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              autoFocus
              onBlur={() => {
                if (!newTag.trim()) setIsAdding(false);
              }}
            />
            <button 
              type="submit"
              className="bg-stone-800 text-white px-2 py-1.5 rounded-r-full text-xs border border-stone-800 hover:bg-stone-700 transition-colors"
            >
              추가
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
