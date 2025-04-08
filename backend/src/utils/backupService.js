const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const { BACKUP } = require('../config/constants');
const dotenv = require('dotenv');

dotenv.config();

class BackupService {
    constructor() {
        this.backupDir = path.join(__dirname, '../../backups');
        this.ensureBackupDirectory();
    }

    ensureBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.gz`;
        const filepath = path.join(this.backupDir, filename);

        const command = `mongodump --uri="${process.env.MONGODB_URI}" --archive="${filepath}" --gzip`;

        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    logger.error('Backup Error:', error);
                    reject(error);
                    return;
                }
                logger.info(`Backup created successfully: ${filename}`);
                resolve(filepath);
            });
        });
    }

    async restoreBackup(filepath) {
        const command = `mongorestore --uri="${process.env.MONGODB_URI}" --archive="${filepath}" --gzip`;

        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    logger.error('Restore Error:', error);
                    reject(error);
                    return;
                }
                logger.info('Backup restored successfully');
                resolve();
            });
        });
    }

    async cleanupOldBackups() {
        const files = fs.readdirSync(this.backupDir);
        const now = new Date();
        const retentionPeriod = BACKUP.RETENTION_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds

        for (const file of files) {
            const filepath = path.join(this.backupDir, file);
            const stats = fs.statSync(filepath);
            const fileAge = now - stats.mtime;

            if (fileAge > retentionPeriod) {
                fs.unlinkSync(filepath);
                logger.info(`Deleted old backup: ${file}`);
            }
        }
    }
}

module.exports = new BackupService(); 