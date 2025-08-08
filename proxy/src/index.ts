import path from 'path';
import express from 'express';
import { blockGuard } from './middleware/blockGuard';

const app = express();
app.set('trust proxy', true);

// 静的ファイル配信（public内のHTML等をそのまま返す）
app.use(express.static(path.join(process.cwd(), 'public')));

app.get('/health', (_req, res) => res.send('ok'));

app.use(blockGuard);

app.get('/proxy-endpoint', (_req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => console.log(`Proxy listening on http://localhost:${PORT}`));
