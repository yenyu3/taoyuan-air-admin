/**
 * sftpClient.ts
 *
 * 提供一個可重複使用的 SFTP 連線工廠。
 * 每次呼叫 getSftpClient() 時：
 *   1. 若目前連線仍存活，直接回傳
 *   2. 否則重新建立連線後回傳
 *
 * 採單例模式，避免每次上傳都重新 SSH handshake。
 */

import SftpClient from 'ssh2-sftp-client';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// ── 設定讀取 ──────────────────────────────────────────────────────────────────

function buildConnectOptions(): SftpClient.ConnectOptions {
  const host = process.env.SFTP_HOST;
  const port = Number(process.env.SFTP_PORT ?? 22);
  const username = process.env.SFTP_USER;

  if (!host || !username) {
    throw new Error('[SftpClient] 缺少必要的環境變數：SFTP_HOST、SFTP_USER');
  }

  const privateKeyPath = process.env.SFTP_PRIVATE_KEY_PATH;
  if (privateKeyPath) {
    return {
      host,
      port,
      username,
      privateKey: fs.readFileSync(privateKeyPath),
      passphrase: process.env.SFTP_PASSPHRASE ?? undefined,
    };
  }

  const password = process.env.SFTP_PASSWORD;
  if (!password) {
    throw new Error('[SftpClient] 需要 SFTP_PASSWORD 或 SFTP_PRIVATE_KEY_PATH');
  }

  return { host, port, username, password };
}

// ── 單例 ──────────────────────────────────────────────────────────────────────

let client: SftpClient | null = null;
let isConnected = false;

export async function getSftpClient(): Promise<SftpClient> {
  // 若已有連線，先確認是否仍存活
  if (client && isConnected) {
    try {
      // 用 list('/') 當作 ping，若拋錯代表連線已斷
      await client.list('/');
      return client;
    } catch {
      isConnected = false;
      client = null;
    }
  }

  // 建立新連線
  const sftp = new SftpClient('taoyuan-air');
  const opts = buildConnectOptions();

  sftp.on('close', () => { isConnected = false; client = null; });
  sftp.on('end',   () => { isConnected = false; client = null; });
  sftp.on('error', () => { isConnected = false; client = null; });

  await sftp.connect(opts);
  client = sftp;
  isConnected = true;

  process.stderr.write(
    `[SftpClient] 已連線至 ${opts.host}:${opts.port} (user: ${opts.username})\n`,
  );

  return client;
}

/**
 * 應用程式關閉時呼叫，優雅釋放連線。
 */
export async function closeSftpClient(): Promise<void> {
  if (client && isConnected) {
    try { await client.end(); } catch { /* 忽略關閉錯誤 */ }
  }
  client = null;
  isConnected = false;
}
