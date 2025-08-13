import * as fs from 'fs/promises';
import * as path from 'path';
import * as YAML from 'yaml';
import { StorageProvider, Prompt } from '../types';

export class FileStorage implements StorageProvider {
  private readonly dataPath: string;
  private readonly backupPath: string;

  constructor(dataDir = 'data') {
    this.dataPath = path.join(process.cwd(), dataDir, 'prompts.yaml');
    this.backupPath = path.join(process.cwd(), dataDir, 'backups');
  }

  async load(): Promise<Record<string, Prompt>> {
    try {
      await this.ensureDirectoryExists();
      
      const fileExists = await this.fileExists(this.dataPath);
      if (!fileExists) {
        // Create empty file with initial structure
        await this.save({});
        return {};
      }

      const yamlContent = await fs.readFile(this.dataPath, 'utf-8');
      const data = YAML.parse(yamlContent) || {};
      
      // Validate and transform data to ensure consistency
      return this.validateAndTransformData(data);
    } catch (error) {
      console.error('Error loading prompts:', error);
      throw new Error(`Failed to load prompts: ${(error as Error).message}`);
    }
  }

  async save(prompts: Record<string, Prompt>): Promise<void> {
    try {
      await this.ensureDirectoryExists();
      
      // Create a backup before saving
      if (await this.fileExists(this.dataPath)) {
        await this.backup();
      }

      const yamlContent = YAML.stringify(prompts, {
        indent: 2,
        lineWidth: 120,
        minContentWidth: 20,
      });

      await fs.writeFile(this.dataPath, yamlContent, 'utf-8');
    } catch (error) {
      console.error('Error saving prompts:', error);
      throw new Error(`Failed to save prompts: ${(error as Error).message}`);
    }
  }

  async backup(): Promise<void> {
    try {
      await this.ensureDirectoryExists(this.backupPath);
      
      if (await this.fileExists(this.dataPath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `prompts-backup-${timestamp}.yaml`;
        const backupFilePath = path.join(this.backupPath, backupFileName);
        
        await fs.copyFile(this.dataPath, backupFilePath);
        
        // Keep only the last 10 backups
        await this.cleanupOldBackups();
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error(`Failed to create backup: ${(error as Error).message}`);
    }
  }

  private async ensureDirectoryExists(dirPath?: string): Promise<void> {
    const targetPath = dirPath || path.dirname(this.dataPath);
    try {
      await fs.access(targetPath);
    } catch {
      await fs.mkdir(targetPath, { recursive: true });
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private validateAndTransformData(data: unknown): Record<string, Prompt> {
    if (!data || typeof data !== 'object') {
      return {};
    }

    const result: Record<string, Prompt> = {};
    const dataRecord = data as Record<string, unknown>;

    for (const [key, value] of Object.entries(dataRecord)) {
      if (this.isValidPrompt(value)) {
        result[key] = value as Prompt;
      } else {
        console.warn(`Invalid prompt data for key ${key}, skipping`);
      }
    }

    return result;
  }

  private isValidPrompt(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    
    const prompt = value as Record<string, unknown>;
    return (
      typeof prompt.id === 'string' &&
      typeof prompt.title === 'string' &&
      typeof prompt.content === 'string' &&
      Array.isArray(prompt.tags) &&
      typeof prompt.category === 'string' &&
      typeof prompt.metadata === 'object' &&
      prompt.metadata !== null
    );
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = await fs.readdir(this.backupPath);
      const backupFiles = files
        .filter(file => file.startsWith('prompts-backup-') && file.endsWith('.yaml'))
        .sort()
        .reverse();

      if (backupFiles.length > 10) {
        const filesToDelete = backupFiles.slice(10);
        for (const file of filesToDelete) {
          await fs.unlink(path.join(this.backupPath, file));
        }
      }
    } catch (error) {
      console.warn('Warning: Could not cleanup old backups:', error);
    }
  }
}