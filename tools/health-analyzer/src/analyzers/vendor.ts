import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';
import type {
  Analyzer,
  AnalyzerConfig,
  VendorAnalysis,
  VendorTemplate,
  VendorTool,
  VendorConfig,
} from '../types.js';

const VENDOR_TOOL_COMMANDS: Record<
  string,
  { vendor: string; category: string }
> = {
  npm: { vendor: 'npmjs.com', category: 'package-manager' },
  pnpm: { vendor: 'pnpm.io', category: 'package-manager' },
  yarn: { vendor: 'yarnpkg.com', category: 'package-manager' },
  pixi: { vendor: 'pixi.sh', category: 'package-manager' },
  docker: { vendor: 'docker.com', category: 'infrastructure' },
  terraform: { vendor: 'hashicorp.com', category: 'infrastructure' },
  kubectl: { vendor: 'kubernetes.io', category: 'infrastructure' },
  helm: { vendor: 'helm.sh', category: 'infrastructure' },
  gh: { vendor: 'github.com', category: 'development' },
  git: { vendor: 'git-scm.com', category: 'development' },
  node: { vendor: 'nodejs.org', category: 'runtime' },
  python: { vendor: 'python.org', category: 'runtime' },
  cargo: { vendor: 'rust-lang.org', category: 'runtime' },
  ollama: { vendor: 'ollama.ai', category: 'ai' },
  prisma: { vendor: 'prisma.io', category: 'database' },
  op: { vendor: '1password.com', category: 'security' },
  'sentry-cli': { vendor: 'sentry.io', category: 'monitoring' },
  'ast-grep': { vendor: 'ast-grep.github.io', category: 'code-quality' },
  ruff: { vendor: 'astral.sh', category: 'code-quality' },
  eslint: { vendor: 'eslint.org', category: 'code-quality' },
  prettier: { vendor: 'prettier.io', category: 'code-quality' },
};

const VENDOR_CATEGORIES: Record<
  string,
  'ai-ml' | 'web-framework' | 'workflow' | 'database' | 'infrastructure'
> = {
  langchain: 'ai-ml',
  langgraph: 'ai-ml',
  fastapi: 'web-framework',
  nextjs: 'web-framework',
  temporal: 'workflow',
  n8n: 'workflow',
};

const REQUIRED_VENDORS = [
  'prisma',
  'docker',
  'git',
  'node',
  'npm',
  'eslint',
  'prettier',
  'typescript',
];

export class VendorAnalyzer implements Analyzer<VendorAnalysis> {
  name = 'VendorAnalyzer';

  async analyze(
    basePath: string,
    config: AnalyzerConfig
  ): Promise<VendorAnalysis> {
    const [templates, tools, configurations] = await Promise.all([
      this.scanTemplates(basePath),
      this.scanTools(),
      this.scanConfigurations(basePath),
    ]);

    const installedVendors = new Set([
      ...templates.map((t) => t.vendor.toLowerCase()),
      ...tools.filter((t) => t.installed).map((t) => t.name.toLowerCase()),
    ]);

    const missingVendors = REQUIRED_VENDORS.filter(
      (v) => !installedVendors.has(v)
    );

    const adoptionRate = this.calculateAdoptionRate(
      templates,
      tools,
      configurations
    );
    const score = this.calculateScore(adoptionRate, missingVendors.length);

    return {
      score,
      templates,
      tools,
      configurations,
      adoptionRate,
      missingVendors,
    };
  }

  private async scanTemplates(basePath: string): Promise<VendorTemplate[]> {
    const templates: VendorTemplate[] = [];
    const templateDirs = await glob('templates/vendor/*/', { cwd: basePath });

    for (const dir of templateDirs) {
      const vendorName = path.basename(dir);
      const fullPath = path.join(basePath, dir);
      const readmePath = path.join(fullPath, 'README.md');

      let status: 'installed' | 'configured' | 'available' = 'available';

      try {
        await fs.access(readmePath);
        status = 'configured';

        const nodeModulesPath = path.join(fullPath, 'node_modules');
        try {
          await fs.access(nodeModulesPath);
          status = 'installed';
        } catch {}
      } catch {}

      templates.push({
        name: vendorName,
        path: fullPath,
        vendor: vendorName,
        category: VENDOR_CATEGORIES[vendorName] || 'infrastructure',
        status,
      });
    }

    return templates;
  }

  private async scanTools(): Promise<VendorTool[]> {
    const tools: VendorTool[] = [];

    for (const [command, info] of Object.entries(VENDOR_TOOL_COMMANDS)) {
      const installed = await this.isCommandAvailable(command);
      let version: string | undefined;

      if (installed) {
        version = await this.getCommandVersion(command);
      }

      tools.push({
        name: command,
        command,
        vendor: info.vendor,
        category: info.category,
        installed,
        version,
      });
    }

    return tools;
  }

  private async isCommandAvailable(command: string): Promise<boolean> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      await execAsync(`which ${command}`);
      return true;
    } catch {
      return false;
    }
  }

  private async getCommandVersion(
    command: string
  ): Promise<string | undefined> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      const versionFlag = command === 'go' ? 'version' : '--version';
      const { stdout } = await execAsync(
        `${command} ${versionFlag} 2>/dev/null`
      );
      const firstLine = stdout.split('\n')[0];
      return firstLine.trim().slice(0, 50);
    } catch {
      return undefined;
    }
  }

  private async scanConfigurations(basePath: string): Promise<VendorConfig[]> {
    const configs: VendorConfig[] = [];

    const configPatterns = [
      'configs/vendor-tool-manager.json',
      '.vendor-config/**/*',
      'config/vendors/*.json',
      'configs/mcp/*.json',
    ];

    for (const pattern of configPatterns) {
      const files = await glob(pattern, { cwd: basePath });

      for (const file of files) {
        const fullPath = path.join(basePath, file);
        const ext = path.extname(file);
        const type =
          ext === '.json'
            ? 'json'
            : ext === '.yaml' || ext === '.yml'
              ? 'yaml'
              : ext === '.toml'
                ? 'toml'
                : 'env';

        let valid = true;
        const issues: string[] = [];

        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          if (type === 'json') {
            JSON.parse(content);
          }
        } catch (e) {
          valid = false;
          issues.push(
            `Parse error: ${e instanceof Error ? e.message : 'Unknown error'}`
          );
        }

        const vendor = this.extractVendorFromPath(file);

        configs.push({
          path: fullPath,
          vendor,
          type,
          valid,
          issues,
        });
      }
    }

    return configs;
  }

  private extractVendorFromPath(filePath: string): string {
    const parts = filePath.split('/');
    for (const part of parts) {
      if (part.includes('vendor') || VENDOR_TOOL_COMMANDS[part]) {
        return part;
      }
    }
    return path.basename(filePath, path.extname(filePath));
  }

  private calculateAdoptionRate(
    templates: VendorTemplate[],
    tools: VendorTool[],
    _configs: VendorConfig[]
  ): number {
    const installedTemplates = templates.filter(
      (t) => t.status === 'installed' || t.status === 'configured'
    ).length;
    const totalTemplates = templates.length || 1;

    const installedTools = tools.filter((t) => t.installed).length;
    const totalTools = tools.length || 1;

    const templateRate = (installedTemplates / totalTemplates) * 100;
    const toolRate = (installedTools / totalTools) * 100;

    return Math.round(templateRate * 0.4 + toolRate * 0.6);
  }

  private calculateScore(adoptionRate: number, missingCount: number): number {
    const basePenalty = missingCount * 5;
    return Math.max(0, Math.min(100, adoptionRate - basePenalty));
  }
}
