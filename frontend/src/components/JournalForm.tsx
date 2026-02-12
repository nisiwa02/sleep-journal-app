import { useState, FormEvent } from 'react';

interface JournalFormProps {
  onSubmit: (data: {
    journal_text: string;
    mood?: number;
    stress?: number;
  }) => void;
  isLoading: boolean;
}

function JournalForm({ onSubmit, isLoading }: JournalFormProps) {
  const [journalText, setJournalText] = useState('');
  const [mood, setMood] = useState<number | undefined>(undefined);
  const [stress, setStress] = useState<number | undefined>(undefined);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!journalText.trim()) {
      alert('ジャーナルを入力してください');
      return;
    }

    onSubmit({
      journal_text: journalText,
      mood,
      stress,
    });
  };

  const handleClear = () => {
    setJournalText('');
    setMood(undefined);
    setStress(undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="journal-form">
      <div className="form-group">
        <label htmlFor="journal">
          今日の振り返り（最大4000文字）
        </label>
        <textarea
          id="journal"
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          maxLength={4000}
          rows={8}
          placeholder="今日はどんな一日でしたか？思いついたことを自由に書いてみてください..."
          disabled={isLoading}
          required
        />
        <div className="char-count">
          {journalText.length} / 4000 文字
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="mood">気分 (1-5、任意)</label>
          <select
            id="mood"
            value={mood || ''}
            onChange={(e) => setMood(e.target.value ? parseInt(e.target.value) : undefined)}
            disabled={isLoading}
          >
            <option value="">選択しない</option>
            <option value="1">1 - とても悪い</option>
            <option value="2">2 - 悪い</option>
            <option value="3">3 - 普通</option>
            <option value="4">4 - 良い</option>
            <option value="5">5 - とても良い</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="stress">ストレス (1-7、任意)</label>
          <select
            id="stress"
            value={stress || ''}
            onChange={(e) => setStress(e.target.value ? parseInt(e.target.value) : undefined)}
            disabled={isLoading}
          >
            <option value="">選択しない</option>
            <option value="1">1 - とても低い</option>
            <option value="2">2 - 低い</option>
            <option value="3">3 - やや低い</option>
            <option value="4">4 - 普通</option>
            <option value="5">5 - やや高い</option>
            <option value="6">6 - 高い</option>
            <option value="7">7 - とても高い</option>
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={handleClear}
          disabled={isLoading}
          className="btn-secondary"
        >
          クリア
        </button>
        <button
          type="submit"
          disabled={isLoading || !journalText.trim()}
          className="btn-primary"
        >
          {isLoading ? '分析中...' : 'フィードバックを受け取る'}
        </button>
      </div>
    </form>
  );
}

export default JournalForm;
