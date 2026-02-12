import { FeedbackResponse } from '../types';

interface FeedbackDisplayProps {
  feedback: FeedbackResponse;
}

function FeedbackDisplay({ feedback }: FeedbackDisplayProps) {
  const getRiskColor = (score: number) => {
    if (score >= 0.7) return 'risk-high';
    if (score >= 0.4) return 'risk-medium';
    return 'risk-low';
  };

  return (
    <div className="feedback-display">
      <h2>フィードバック</h2>

      {feedback.safety_note && (
        <div className="safety-alert">
          <h3>⚠️ 重要なお知らせ</h3>
          <p>{feedback.safety_note}</p>
        </div>
      )}

      <div className="feedback-section">
        <h3>要約</h3>
        <p>{feedback.summary}</p>
      </div>

      <div className="feedback-section">
        <h3>共感的フィードバック</h3>
        <p>{feedback.empathic_feedback}</p>
      </div>

      <div className="feedback-section">
        <h3>タグ</h3>
        <div className="tags">
          {feedback.tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="feedback-section">
        <h3>メンタルヘルススコア</h3>
        <div className={`risk-indicator ${getRiskColor(feedback.risk_score)}`}>
          <div className="risk-bar">
            <div
              className="risk-fill"
              style={{ width: `${feedback.risk_score * 100}%` }}
            />
          </div>
          <span className="risk-value">
            {(feedback.risk_score * 100).toFixed(0)}%
          </span>
        </div>
        {feedback.risk_score >= 0.7 && (
          <p className="risk-warning">
            高めのスコアです。必要に応じて専門家にご相談ください。
          </p>
        )}
      </div>

      <div className="feedback-section">
        <h3>次のアクション</h3>
        <ul className="actions-list">
          {feedback.next_actions.map((action, index) => (
            <li key={index}>{action}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default FeedbackDisplay;
