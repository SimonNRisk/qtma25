'use client';

import { useState } from 'react';
import { FaEdit, FaCheck, FaTimes } from 'react-icons/fa';

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  };
  onEdit?: (messageId: string, newContent: string) => void;
  isStreaming?: boolean;
}

export function ChatMessage({ message, onEdit, isStreaming = false }: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number | null>(null);

  // Split content into sentences for editing
  // Use a regex that captures sentence endings with their following whitespace
  const sentenceParts = message.content.split(/(?<=[.!?])\s+/);
  const sentences = sentenceParts
    .map((part, idx) => ({
      text: part,
      index: idx,
      originalIndex: idx,
    }))
    .filter(s => s.text.trim().length > 0);

  const handleSentenceClick = (index: number) => {
    setSelectedSentenceIndex(index);
    setIsEditing(true);
    setEditedContent(sentences[index].text.trim());
  };

  const handleSaveEdit = () => {
    if (onEdit && editedContent.trim() && selectedSentenceIndex !== null) {
      // Replace the selected sentence with edited content
      const selectedSentence = sentences[selectedSentenceIndex];
      // Find the original sentence in the content and replace it
      const sentenceParts = message.content.split(/(?<=[.!?])\s+/);
      sentenceParts[selectedSentence.originalIndex] = editedContent.trim();
      const newContent = sentenceParts.join(' ');
      onEdit(message.id, newContent);
    }
    setIsEditing(false);
    setSelectedSentenceIndex(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedSentenceIndex(null);
    setEditedContent(message.content);
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[80%] bg-brand-dark rounded-2xl px-6 py-4 shadow-lg">
          <p className="text-white whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-[80%] bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20 shadow-lg">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-brand-dark resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
              >
                <FaCheck className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm"
              >
                <FaTimes className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-white/90 whitespace-pre-wrap">
              {sentences.map((sentence, index) => (
                <span
                  key={index}
                  onClick={() => handleSentenceClick(index)}
                  className={`hover:bg-white/10 rounded px-1 py-0.5 cursor-pointer transition-colors inline ${
                    selectedSentenceIndex === index ? 'bg-white/20' : ''
                  }`}
                  title="Click to edit this sentence"
                >
                  {sentence.text}
                </span>
              ))}
            </div>
            {isStreaming && (
              <div className="flex items-center gap-2 text-white/60 text-sm mt-2">
                <div className="w-2 h-2 bg-brand-dark rounded-full animate-pulse" />
                <span>Generating...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

