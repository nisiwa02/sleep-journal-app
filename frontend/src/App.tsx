import { useState } from 'react';
import JournalForm from './components/JournalForm';
import FeedbackDisplay from './components/FeedbackDisplay';
import { FeedbackResponse } from './types';
import './App.css';

function App() {
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (journalData: {
    journal_text: string;
    mood?: number;
    stress?: number;
  }) => {
    setIsLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/v1/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...journalData,
          language: 'ja',
          timezone: 'Asia/Tokyo',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get feedback');
      }

      const data: FeedbackResponse = await response.json();
      setFeedback(data);

      // Save to localStorage
      const history = JSON.parse(localStorage.getItem('journal_history') || '[]');
      history.unshift({
        timestamp: new Date().toISOString(),
        journal_text: journalData.journal_text,
        feedback: data,
      });
      // Keep only last 10 entries
      localStorage.setItem('journal_history', JSON.stringify(history.slice(0, 10)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>💤 Sleep Journal</h1>
        <p className="subtitle">就寝前のジャーナリングをサポートします</p>
      </header>

      <main className="app-main">
        <JournalForm onSubmit={handleSubmit} isLoading={isLoading} />

        {error && (
          <div className="error-message">
            <p>エラー: {error}</p>
          </div>
        )}

        {feedback && <FeedbackDisplay feedback={feedback} />}
      </main>

      <footer className="app-footer">
        <p>
          このアプリは医療的助言を提供するものではありません。
          緊急時は専門機関にご相談ください。
        </p>
      </footer>
    </div>
  );
}

export default App;
