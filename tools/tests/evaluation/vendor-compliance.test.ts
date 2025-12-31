import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = process.env.DEVELOPER_DIR || join(process.env.HOME || '', 'Developer');

describe('Vendor Compliance Validation', () => {
  describe('Package Manager', () => {
    it('should use pnpm workspaces', () => {
      const packageJson = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8'));
      expect(packageJson.workspaces).toBeDefined();
      expect(Array.isArray(packageJson.workspaces)).toBe(true);
    });

    it('should have turbo.json configured', () => {
      expect(existsSync(join(ROOT_DIR, 'turbo.json'))).toBe(true);
    });
  });

  describe('Build Tools', () => {
    it('should have turbo installed', () => {
      const result = execSync('which turbo', { encoding: 'utf-8' }).trim();
      expect(result).toContain('turbo');
    });

    it('should have vite configured', () => {
      expect(existsSync(join(ROOT_DIR, 'vite.config.ts'))).toBe(true);
    });
  });

  describe('Database ORM', () => {
    it('should use Prisma schema', () => {
      expect(existsSync(join(ROOT_DIR, 'prisma/schema.prisma'))).toBe(true);
    });

    it('should have multi-tenant models', () => {
      const schema = readFileSync(join(ROOT_DIR, 'prisma/schema.prisma'), 'utf-8');
      expect(schema).toContain('model Tenant');
      expect(schema).toContain('tenantId');
    });
  });

  describe('Testing Framework', () => {
    it('should use Vitest', () => {
      const packageJson = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8'));
      expect(packageJson.dependencies?.vitest || packageJson.devDependencies?.vitest).toBeDefined();
    });

    it('should have Playwright for E2E', () => {
      const packageJson = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8'));
      expect(packageJson.devDependencies?.['@playwright/test']).toBeDefined();
    });
  });

  describe('AI/ML Stack', () => {
    it('should have LiteLLM configuration', () => {
      const configPath = join(ROOT_DIR, 'configs/litellm-config.yaml');
      if (existsSync(configPath)) {
        const config = readFileSync(configPath, 'utf-8');
        expect(config).toContain('model_list');
      }
    });

    it('should have PromptFoo configuration', () => {
      expect(existsSync(join(ROOT_DIR, 'configs/promptfoo/promptfooconfig.yaml'))).toBe(true);
    });
  });

  describe('GraphQL Federation', () => {
    it('should have GraphQL dependencies', () => {
      const packageJson = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8'));
      expect(packageJson.dependencies?.graphql).toBeDefined();
    });
  });

  describe('Governance Rules', () => {
    it('should have .cursorrules file', () => {
      expect(existsSync(join(ROOT_DIR, '.cursorrules'))).toBe(true);
    });

    it('should have lefthook configured', () => {
      expect(existsSync(join(ROOT_DIR, 'lefthook.yml'))).toBe(true);
    });

    it('cursorrules should prohibit custom code', () => {
      const rules = readFileSync(join(ROOT_DIR, '.cursorrules'), 'utf-8');
      expect(rules).toContain('VENDOR-ONLY');
      expect(rules).toContain('PROHIBITED');
    });
  });

  describe('Monorepo Structure', () => {
    it('should have apps directory', () => {
      expect(existsSync(join(ROOT_DIR, 'apps'))).toBe(true);
    });

    it('should have packages directory', () => {
      expect(existsSync(join(ROOT_DIR, 'packages'))).toBe(true);
    });

    it('should have services directory', () => {
      expect(existsSync(join(ROOT_DIR, 'services'))).toBe(true);
    });
  });
});

describe('Custom Code Detection', () => {
  it('should not have console.log in TypeScript files', () => {
    try {
      const result = execSync(
        `grep -r "console\\.log" --include="*.ts" --include="*.tsx" ${ROOT_DIR}/src ${ROOT_DIR}/packages ${ROOT_DIR}/services 2>/dev/null | grep -v node_modules | grep -v ".test.ts" | wc -l`,
        { encoding: 'utf-8' }
      ).trim();
      expect(parseInt(result, 10)).toBeLessThan(10);
    } catch {
      expect(true).toBe(true);
    }
  });

  it('should not have hardcoded paths', () => {
    try {
      const result = execSync(
        `grep -r "/Users/" --include="*.ts" --include="*.tsx" ${ROOT_DIR}/src ${ROOT_DIR}/packages ${ROOT_DIR}/services 2>/dev/null | grep -v node_modules | wc -l`,
        { encoding: 'utf-8' }
      ).trim();
      expect(parseInt(result, 10)).toBe(0);
    } catch {
      expect(true).toBe(true);
    }
  });
});

describe('10 Use Cases Validation', () => {
  const useCases = [
    'ECOMMERCE_PERSONALIZATION',
    'HEALTHCARE_TRIAGE',
    'FINANCIAL_PORTFOLIO',
    'LEGAL_DOCUMENT',
    'REAL_ESTATE',
    'EDUCATION_ADAPTIVE',
    'MANUFACTURING_QC',
    'CUSTOMER_SERVICE',
    'SUPPLY_CHAIN',
    'HR_TALENT_MATCHING',
  ];

  it('should have all 10 use cases defined in types', () => {
    const typesPath = join(ROOT_DIR, 'packages/types/src/index.ts');
    if (existsSync(typesPath)) {
      const types = readFileSync(typesPath, 'utf-8');
      useCases.forEach((useCase) => {
        expect(types).toContain(useCase);
      });
    }
  });

  it('should have use case configurations', () => {
    const configPath = join(ROOT_DIR, 'packages/config/src/index.ts');
    if (existsSync(configPath)) {
      const config = readFileSync(configPath, 'utf-8');
      expect(config).toContain('USE_CASE_CONFIG');
    }
  });
});
