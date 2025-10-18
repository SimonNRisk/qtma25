'use client';
import { useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { LINKEDIN_VIEW_POST_URL } from './utils/constants';

export default function LinkedInPost() {
  const [isPosting, setIsPosting] = useState(false);
  const [result, setResult] = useState('');
  const [postText, setPostText] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

      const response = await fetch('http://localhost:8000/api/linkedin/post', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setResult('Success!');
        setLinkedinUrl(`https://www.linkedin.com/feed/update/${data.id}`);
      } else {
        setResult(`Error: ${data.error || 'Failed to post'}`);
      }
    } catch (error) {
      setResult(`Network error: ${error}`);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-brand-light p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-brand-dark text-white p-6 rounded-lg shadow-lg mb-6">
            <h1 className="text-3xl font-bold mb-2 text-brand-blue">LinkedIn Demo Post</h1>
            <p className="text-brand-light">Click the button to post a demo message to LinkedIn</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <label htmlFor="postText" className="block text-sm font-medium text-gray-700 mb-2">
                What do you want to post?
              </label>
              <textarea
                id="postText"
                value={postText}
                onChange={e => setPostText(e.target.value)}
                placeholder="Enter your LinkedIn post content here..."
                className="w-full text-black h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-none"
              />
              <div className="text-sm text-gray-500 mt-2">{postText.length} characters</div>
            </div>

            <div className="mb-6">
              <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-700 mb-2">
                Upload an image (optional)
              </label>
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              />
              {selectedFile && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div className="text-center">
              <button
                onClick={handlePost}
                disabled={isPosting || !postText.trim()}
                className="bg-brand-blue text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
              >
                {isPosting ? 'Posting...' : 'Post to LinkedIn'}
              </button>
            </div>
          </div>

          {result && (
            <div className="mt-6 p-4 rounded-lg bg-gray-100 border-l-4 border-brand-blue">
              <p className="text-gray-800 mb-2">{result}</p>
              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-brand-blue hover:text-blue-600 underline font-medium"
                >
                  View your post on LinkedIn →
                </a>
              )}
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
