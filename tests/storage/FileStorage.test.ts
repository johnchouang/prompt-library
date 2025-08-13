import * as fs from 'fs/promises';
import * as path from 'path';
import { FileStorage } from '../../src/storage/FileStorage';
import { Prompt } from '../../src/types';

describe('FileStorage', () => {
  let storage: FileStorage;
  const testDataDir = 'test-data';

  beforeEach(() => {
    storage = new FileStorage(testDataDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }
  });

  describe('load', () => {
    it('should return empty object when file does not exist', async () => {
      const result = await storage.load();
      expect(result).toEqual({});
    });

    it('should load prompts from YAML file', async () => {
      const testPrompts: Record<string, Prompt> = {
        '123': {
          id: '123',
          title: 'Test Prompt',
          content: 'Test content',
          tags: ['test'],
          category: 'testing',
          metadata: {
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            version: '1.0.0',
            usage: 0,
          },
        },
      };

      await storage.save(testPrompts);
      const result = await storage.load();

      expect(result).toEqual(testPrompts);
    });

    it('should handle corrupted YAML file gracefully', async () => {
      // Create directory
      await fs.mkdir(path.join(process.cwd(), testDataDir), { recursive: true });
      
      // Write invalid YAML
      const filePath = path.join(process.cwd(), testDataDir, 'prompts.yaml');
      await fs.writeFile(filePath, 'invalid: yaml: content: [', 'utf-8');

      await expect(storage.load()).rejects.toThrow('Failed to load prompts');
    });

    it('should filter out invalid prompt data', async () => {
      // Create directory
      await fs.mkdir(path.join(process.cwd(), testDataDir), { recursive: true });
      
      // Write YAML with mixed valid and invalid data
      const filePath = path.join(process.cwd(), testDataDir, 'prompts.yaml');
      const yamlContent = `
valid-prompt:
  id: "123"
  title: "Valid Prompt"
  content: "Valid content"
  tags: ["test"]
  category: "testing"
  metadata:
    createdAt: "2023-01-01T00:00:00.000Z"
    updatedAt: "2023-01-01T00:00:00.000Z"
    version: "1.0.0"
    usage: 0

invalid-prompt:
  id: "456"
  title: "Invalid Prompt"
  # missing required fields

another-invalid:
  not: "a prompt"
`;
      await fs.writeFile(filePath, yamlContent, 'utf-8');

      const result = await storage.load();

      expect(Object.keys(result)).toHaveLength(1);
      expect(result['valid-prompt']).toBeDefined();
      expect(result['invalid-prompt']).toBeUndefined();
      expect(result['another-invalid']).toBeUndefined();
    });
  });

  describe('save', () => {
    it('should save prompts to YAML file', async () => {
      const testPrompts: Record<string, Prompt> = {
        '123': {
          id: '123',
          title: 'Test Prompt',
          content: 'Test content',
          tags: ['test'],
          category: 'testing',
          metadata: {
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            version: '1.0.0',
            usage: 0,
          },
        },
      };

      await storage.save(testPrompts);

      const filePath = path.join(process.cwd(), testDataDir, 'prompts.yaml');
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('Test Prompt');
      expect(content).toContain('Test content');
    });

    it('should create backup before saving', async () => {
      const initialPrompts: Record<string, Prompt> = {
        '123': {
          id: '123',
          title: 'Initial Prompt',
          content: 'Initial content',
          tags: ['test'],
          category: 'testing',
          metadata: {
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            version: '1.0.0',
            usage: 0,
          },
        },
      };

      // Save initial data
      await storage.save(initialPrompts);

      // Save updated data
      const updatedPrompts = { ...initialPrompts };
      updatedPrompts['123']!.title = 'Updated Prompt';
      await storage.save(updatedPrompts);

      // Check backup directory exists
      const backupDir = path.join(process.cwd(), testDataDir, 'backups');
      const backupExists = await fs.access(backupDir).then(() => true).catch(() => false);
      expect(backupExists).toBe(true);

      // Check backup file exists
      const backupFiles = await fs.readdir(backupDir);
      expect(backupFiles.length).toBeGreaterThan(0);
      expect(backupFiles[0]).toMatch(/^prompts-backup-.*\.yaml$/);
    });
  });

  describe('backup', () => {
    it('should create backup file with timestamp', async () => {
      const testPrompts: Record<string, Prompt> = {
        '123': {
          id: '123',
          title: 'Test Prompt',
          content: 'Test content',
          tags: ['test'],
          category: 'testing',
          metadata: {
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
            version: '1.0.0',
            usage: 0,
          },
        },
      };

      await storage.save(testPrompts);
      await storage.backup();

      const backupDir = path.join(process.cwd(), testDataDir, 'backups');
      const backupFiles = await fs.readdir(backupDir);
      
      expect(backupFiles.length).toBeGreaterThan(0);
      expect(backupFiles[0]).toMatch(/^prompts-backup-.*\.yaml$/);
    });

    it('should not fail when no file exists to backup', async () => {
      await expect(storage.backup()).resolves.not.toThrow();
    });
  });
});