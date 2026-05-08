/**
 * ローカル開発用サーバー
 *
 * Lambda の handler を Express で wrap して、本番と同じコードパスをローカル実行する。
 *
 * 起動:
 *   cd backend/local-dev
 *   cp .env.example .env  # 値を埋める
 *   npm install
 *   npm run dev
 *
 * 起点: http://localhost:3001/api/contact
 */

import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.env') });

// ローカル設定
process.env.USE_LOCAL_SECRETS = 'true';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// MOCK_MODE: Lark / SES 認証情報なしでもUI検証できるモード
const MOCK_MODE = process.env.MOCK_MODE === 'true';
if (MOCK_MODE) {
    console.log('[local-dev] MOCK_MODE: Lark/SES/Turnstile を実呼び出しせずにスタブ応答します');
    // Lark / SES / Turnstile 関連モジュールをモック上書き
    const { register } = await import('node:module');
    // 簡易なグローバルフラグ. handler 各モジュール内で参照する
    process.env.MOCK_MODE_ACTIVE = 'true';
}

const { handle } = await import('../lambda/submit-form/src/handler.mjs');

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting (simple in-memory)
const rateMap = new Map(); // ip -> [timestamps]
function checkRate(ip, limit = 10, windowMs = 60_000) {
    const now = Date.now();
    const arr = (rateMap.get(ip) || []).filter((t) => now - t < windowMs);
    arr.push(now);
    rateMap.set(ip, arr);
    return arr.length <= limit;
}

app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

app.use(express.text({ type: 'application/json', limit: '32kb' }));

app.options('/api/contact', async (req, res) => {
    const event = toLambdaEvent(req);
    const result = await handle(event);
    res.status(result.statusCode || 204);
    Object.entries(result.headers || {}).forEach(([k, v]) => res.setHeader(k, v));
    res.send(result.body);
});

app.post('/api/contact', async (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    if (!checkRate(ip)) {
        res.status(429).json({ message: 'リクエストが多すぎます。少し時間をおいてお試しください。' });
        return;
    }
    const event = toLambdaEvent(req, ip);
    try {
        const result = await handle(event);
        res.status(result.statusCode || 500);
        Object.entries(result.headers || {}).forEach(([k, v]) => res.setHeader(k, v));
        res.send(result.body);
    } catch (e) {
        console.error('Handler crashed:', e);
        res.status(500).json({ message: 'サーバーエラー' });
    }
});

app.get('/health', (req, res) => res.json({ ok: true }));

function toLambdaEvent(req, ip) {
    return {
        requestContext: {
            http: {
                method: req.method,
                sourceIp: ip || (req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress),
            },
        },
        headers: req.headers,
        body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}),
    };
}

app.listen(PORT, () => {
    console.log(`[local-dev] listening on http://localhost:${PORT}`);
    console.log(`[local-dev] POST http://localhost:${PORT}/api/contact`);
});
