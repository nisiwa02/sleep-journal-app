# API Documentation

## Base URL

- Production: `https://your-backend-url.run.app`
- Development: `http://localhost:8080`

## Endpoints

### Health Check

```
GET /healthz
```

**Response:**
```json
{
  "status": "ok"
}
```

---

### Generate Feedback

```
POST /v1/feedback
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| journal_text | string | Yes | Journal text (max 4000 chars) |
| mood | number | No | Mood rating (1-5) |
| stress | number | No | Stress level (1-7) |
| language | string | No | Language code (default: "ja") |
| timezone | string | No | Timezone (default: "Asia/Tokyo") |

**Example Request:**
```json
{
  "journal_text": "今日は仕事でプレゼンがあって緊張した。でも無事に終わって安心した。",
  "mood": 3,
  "stress": 5,
  "language": "ja",
  "timezone": "Asia/Tokyo"
}
```

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| summary | string | Brief summary of the journal entry |
| empathic_feedback | string | Empathic feedback message |
| tags | string[] | Related tags |
| risk_score | number | Mental health risk score (0.0-1.0) |
| next_actions | string[] | Suggested next actions |
| safety_note | string\|null | Safety note if risk detected |

**Example Response:**
```json
{
  "summary": "プレゼンの緊張を乗り越えて、無事に終えることができた一日",
  "empathic_feedback": "プレゼンお疲れさまでした。緊張する中でも最後までやり遂げたこと、素晴らしいですね。今は少し安心できているようで良かったです。",
  "tags": ["仕事", "プレゼン", "緊張", "達成感"],
  "risk_score": 0.2,
  "next_actions": [
    "深呼吸をしてリラックスする時間を取る",
    "今日の達成を振り返り、自分を褒める",
    "ゆっくり休息を取る"
  ],
  "safety_note": null
}
```

**Error Responses:**

- `400 Bad Request`: Invalid request body
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Rate Limiting

- 20 requests per minute per IP address

## CORS

The API supports CORS for allowed origins configured in `ALLOWED_ORIGINS` environment variable.

## Security Notes

- Journal text is NEVER logged to Cloud Logging
- Only metadata (request ID, text length, duration) is logged
- All requests are rate-limited
- No data is stored on the server (frontend uses LocalStorage only)
