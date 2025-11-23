'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { LINKEDIN_VIEW_POST_URL } from './utils/constants';
import { AiAssistant } from './components/ai-assistant';
import { usePostHistory } from '@/hooks/usePostHistory';
import { API_URL } from '@/lib/api';
import { FaPaperPlane } from 'react-icons/fa';

function EditPostContent() {
  const searchParams = useSearchParams();
  const [isPosting, setIsPosting] = useState(false);
  const [result, setResult] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Use post history hook
  const {
    currentPost: postText,
    setCurrentPost,
    saveToHistory,
    goBack,
    canGoBack,
  } = usePostHistory('');

  // Check for text query parameter and pre-fill the post
  useEffect(() => {
    const textParam = searchParams.get('text');
    if (textParam) {
      const decodedText = decodeURIComponent(textParam);
      setCurrentPost(decodedText);
    }
  }, [searchParams, setCurrentPost]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handlePost = async () => {
    setIsPosting(true);
    setResult('');
    setLinkedinUrl('');

    try {
      const formData = new FormData();
      formData.append('text', postText);
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const response = await fetch(`${API_URL}/api/linkedin/post`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setResult('Success!');
        setLinkedinUrl(`${LINKEDIN_VIEW_POST_URL}${data.id}`);
      } else {
        setResult(`Error: ${data.error || 'Failed to post'}`);
      }
    } catch (error) {
      setResult(`Network error: ${error}`);
    } finally {
      setIsPosting(false);
    }
  };

  const handlePostUpdate = (newPostText: string) => {
    saveToHistory(newPostText);
  };

  const handleGoBack = () => {
    goBack();
  };

  return (
    <AuthGuard>
      <div className="text-white">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-left text-4xl sm:text-5xl font-medium tracking-tight mb-6 leading-tight text-foreground">
            Edit and refine
            <br />
            your content.
          </h1>
          <div className="h-px w-full max-w-3xl mr-auto bg-white/30 mb-6" />

          {/* Main Content Area */}
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Left Side - Form */}
              <div className="flex-1 w-full">
                {/* Textarea Input Box - Matching Generate Page Style */}
                <div className="mb-8">
                  <div className="relative max-w-3xl mx-auto">
                    <div className="flex items-start gap-3 mb-3">
                      {canGoBack && (
                        <button
                          onClick={handleGoBack}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                          title="Restore previous version"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                            />
                          </svg>
                          Back
                        </button>
                      )}
                    </div>
                    <div
                      className="flex items-start bg-white rounded-xl shadow-[0_25px_55px_rgba(21,55,83,0.55)] overflow-hidden border p-4"
                      style={{ borderColor: 'var(--astro-sky)' }}
                    >
                      <textarea
                        id="postText"
                        value={postText}
                        onChange={e => setCurrentPost(e.target.value)}
                        placeholder="Enter your LinkedIn post content here..."
                        className="flex-1 py-2 px-2 text-base placeholder-gray-500 focus:outline-none bg-transparent resize-none min-h-[200px]"
                        style={{ color: 'var(--astro-midnight)' }}
                      />
                    </div>
                    <div className="text-sm text-white/60 mt-2 ml-1">
                      {postText.length} characters
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="mb-8 max-w-3xl mx-auto">
                  <label
                    htmlFor="imageUpload"
                    className="block text-sm font-medium text-white/90 mb-3"
                  >
                    Upload an image (optional)
                  </label>
                  <div
                    className="flex items-center bg-white rounded-xl shadow-[0_25px_55px_rgba(21,55,83,0.55)] overflow-hidden border p-4"
                    style={{ borderColor: 'var(--astro-sky)' }}
                  >
                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="flex-1 text-base focus:outline-none bg-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-dark file:text-white hover:file:bg-brand-blue cursor-pointer"
                      style={{ color: 'var(--astro-midnight)' }}
                    />
                  </div>
                  {selectedFile && (
                    <div className="mt-2 text-sm text-white/70 ml-1">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}{' '}
                      MB)
                    </div>
                  )}
                </div>

                {/* Post Button */}
                <div className="mb-8 max-w-3xl mx-auto">
                  <div className="flex justify-center">
                    <button
                      onClick={handlePost}
                      disabled={isPosting || !postText.trim()}
                      className="inline-flex items-center gap-2 bg-brand-dark hover:bg-brand-blue text-white px-8 py-4 rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_10px_25px_rgba(20,56,84,0.45)]"
                    >
                      {isPosting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <FaPaperPlane className="w-5 h-5" />
                          Post to LinkedIn
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Result Message */}
                {result && (
                  <div className="mb-6 max-w-3xl mx-auto">
                    <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                      <p className="text-white/90 mb-2">{result}</p>
                      {linkedinUrl && (
                        <a
                          href={linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-white/90 hover:text-white underline font-medium"
                        >
                          View your post on LinkedIn →
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side - AI Assistant */}
              <div className="w-full lg:w-96 flex-shrink-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 sticky top-24">
                  <AiAssistant currentPostText={postText} onPostUpdate={handlePostUpdate} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

export default function EditPost() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditPostContent />
    </Suspense>
  );
}
