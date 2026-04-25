import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadRouter from './routes/uploads';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import { closeSftpClient } from './services/sftpClient';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/users', usersRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const server = app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});


// 關閉：結束前釋放 SFTP 連線
async function gracefulShutdown(signal: string) {
  console.log(`\n[${signal}] 正在關閉伺服器...`);
  server.close(async () => {
    await closeSftpClient();
    console.log('SFTP 連線已關閉，程序結束。');
    process.exit(0);
  });
}

process.on('SIGINT',  () => { gracefulShutdown('SIGINT').catch(console.error); });
process.on('SIGTERM', () => { gracefulShutdown('SIGTERM').catch(console.error); });

export default app;
