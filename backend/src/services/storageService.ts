/**
 * storageService.ts
 *
 * 上傳流程：
 *   1. multer 將檔案暫存至本地 uploads/tmp/<random>
 *   2. storageService.saveFile() 透過 SFTP 把暫存檔傳送到遠端 VM
 *   3. 傳送完成後刪除本地暫存檔
 *   4. 回傳遠端相對路徑（供資料庫 file_path 欄位儲存）
 *
 * 刪除流程：
 *   storageService.deleteFile() 透過 SFTP 刪除遠端檔案。
 */

import fs from 'fs';
import path from 'path';
import { getSftpClient } from './sftpClient';
import type { DataCategory, DataType } from '../shared/types/upload';

// ── 白名單 ────────────────────────────────────────────────────────────────────

const ALLOWED_CATEGORIES = new Set(['uav']);
const ALLOWED_TYPES = new Set([
  'sensor', 'flight_path', 'imagery', 'meteorological',
]);

// 遠端根目錄，例如 /data/taoyuan-air/uploads
function remoteBase(): string {
  const base = process.env.SFTP_REMOTE_BASE;
  if (!base) throw new Error('[StorageService] 缺少環境變數 SFTP_REMOTE_BASE');
  // 確保結尾沒有多餘的 /
  return base.replace(/\/+$/, '');
}

// ── 主服務 ────────────────────────────────────────────────────────────────────

export const StorageService = {
  /**
   * 將 multer 暫存檔透過 SFTP 上傳到遠端 VM。
   *
   * @param tempPath      本地暫存檔路徑（由 multer 產生）
   * @param originalName  原始檔案名稱（已在 route 層 normalize）
   * @param dataCategory  lidar | uav
   * @param dataType      子類型
   * @returns             遠端相對路徑，例如 lidar/point_cloud/1234567890_xxx.las
   */
  async saveFile(
    tempPath: string,
    originalName: string,
    dataCategory: DataCategory,
    dataType: DataType,
  ): Promise<string> {
    // ── 安全性檢查 ──────────────────────────────────────────────────────────
    if (!ALLOWED_CATEGORIES.has(dataCategory) || !ALLOWED_TYPES.has(dataType)) {
      // 暫存檔沒有被使用，記得清除
      safeUnlink(tempPath);
      throw new Error(
        `[StorageService] 不允許的 dataCategory 或 dataType: ${dataCategory}/${dataType}`,
      );
    }

    // ── 產生遠端路徑 ────────────────────────────────────────────────────────
    const timestamp = Date.now();
    const safeName = `${timestamp}_${path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const remoteRelative = `${dataCategory}/${dataType}/${safeName}`;    // 回傳值
    const remoteDir  = `${remoteBase()}/${dataCategory}/${dataType}`;
    const remoteFull = `${remoteDir}/${safeName}`;

    let sftp;
    try {
      sftp = await getSftpClient();

      // 確保遠端目錄存在（等同於 mkdir -p）
      await sftp.mkdir(remoteDir, true);

      // 上傳暫存檔到遠端
      await sftp.put(tempPath, remoteFull);

    } catch (err) {
      // 嘗試清理遠端不完整的檔案（忽略錯誤）
      if (sftp) {
        try { await sftp.delete(remoteFull); } catch { /* 忽略 */ }
      }
      throw new Error(
        `[StorageService] SFTP 上傳失敗：${(err as Error).message}`,
      );
    } finally {
      // 不論成功或失敗，都要清除本地暫存檔
      safeUnlink(tempPath);
    }

    return remoteRelative;
  },

  /**
   * 透過 SFTP 刪除遠端檔案。
   * filePath 為 saveFile() 回傳的相對路徑，例如 lidar/point_cloud/xxx.las
   */
  async deleteFile(filePath: string): Promise<void> {
    if (!filePath) return;

    // ── 路徑安全性：防止路徑穿越 ────────────────────────────────────────────
    const normalized = path.posix.normalize(filePath);
    if (normalized.startsWith('..') || path.posix.isAbsolute(normalized)) {
      throw new Error(
        `[StorageService] 拒絕刪除不合法的路徑: ${filePath}`,
      );
    }

    const remoteFull = `${remoteBase()}/${normalized}`;

    try {
      const sftp = await getSftpClient();

      // 確認檔案存在再刪除，避免 SFTP 拋出 No such file 錯誤
      const exists = await sftp.exists(remoteFull);
      if (exists) {
        await sftp.delete(remoteFull);
      }
    } catch (err) {
      throw new Error(
        `[StorageService] SFTP 刪除失敗：${(err as Error).message}`,
      );
    }
  },
};

// ── 工具函式 ──────────────────────────────────────────────────────────────────

function safeUnlink(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    process.stderr.write(
      `[StorageService] 無法刪除本地暫存檔 ${filePath}: ${(err as Error).message}\n`,
    );
  }
}
