import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';
import type {
  Analyzer,
  AnalyzerConfig,
  InfrastructureAnalysis,
  DockerAnalysis,
  DockerComposeFile,
  Dockerfile,
  DockerService,
  KubernetesAnalysis,
  HelmChart,
  K8sManifest,
  MonitoringAnalysis,
  HealthCheck,
  CiCdAnalysis,
  CiCdWorkflow,
} from '../types.js';

export class InfrastructureAnalyzer implements Analyzer<InfrastructureAnalysis> {
  name = 'InfrastructureAnalyzer';

  async analyze(
    basePath: string,
    _config: AnalyzerConfig
  ): Promise<InfrastructureAnalysis> {
    const [docker, kubernetes, monitoring, cicd] = await Promise.all([
      this.analyzeDocker(basePath),
      this.analyzeKubernetes(basePath),
      this.analyzeMonitoring(basePath),
      this.analyzeCiCd(basePath),
    ]);

    const score = this.calculateScore(docker, kubernetes, monitoring, cicd);

    return { score, docker, kubernetes, monitoring, cicd };
  }

  private async analyzeDocker(basePath: string): Promise<DockerAnalysis> {
    const composeFiles: DockerComposeFile[] = [];
    const dockerfiles: Dockerfile[] = [];
    const services: DockerService[] = [];
    const networks = new Set<string>();
    const volumes = new Set<string>();

    const composePatterns = await glob('**/docker-compose*.{yml,yaml}', {
      cwd: basePath,
      ignore: ['**/node_modules/**'],
    });

    for (const file of composePatterns) {
      const fullPath = path.join(basePath, file);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const serviceNames = this.extractDockerServices(content);

        let environment: DockerComposeFile['environment'] = 'services';
        if (file.includes('development')) environment = 'development';
        else if (file.includes('production')) environment = 'production';
        else if (file.includes('staging')) environment = 'staging';

        composeFiles.push({
          path: fullPath,
          environment,
          services: serviceNames,
        });

        for (const serviceName of serviceNames) {
          const serviceConfig = this.extractServiceConfig(content, serviceName);
          if (serviceConfig) {
            services.push({ ...serviceConfig, composeFile: fullPath });
          }
        }

        const networkMatches = content.match(
          /networks:\s*\n((?:\s+-?\s*\w+\n?)+)/g
        );
        if (networkMatches) {
          for (const match of networkMatches) {
            const names = match.match(/\w+:/g);
            if (names) {
              for (const n of names) networks.add(n.replace(':', ''));
            }
          }
        }

        const volumeMatches = content.match(
          /volumes:\s*\n((?:\s+-?\s*\w+\n?)+)/g
        );
        if (volumeMatches) {
          for (const match of volumeMatches) {
            const names = match.match(/\w+:/g);
            if (names) {
              for (const v of names) volumes.add(v.replace(':', ''));
            }
          }
        }
      } catch {}
    }

    const dockerfilePatterns = await glob('**/Dockerfile*', {
      cwd: basePath,
      ignore: ['**/node_modules/**'],
    });

    for (const file of dockerfilePatterns) {
      const fullPath = path.join(basePath, file);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const fromMatch = content.match(/FROM\s+([^\s]+)/);
        const stageCount = (content.match(/FROM\s+/g) || []).length;

        dockerfiles.push({
          path: fullPath,
          baseImage: fromMatch?.[1] || 'unknown',
          stages: stageCount,
        });
      } catch {}
    }

    return {
      composeFiles,
      dockerfiles,
      services,
      networks: Array.from(networks),
      volumes: Array.from(volumes),
    };
  }

  private extractDockerServices(content: string): string[] {
    const services: string[] = [];
    const lines = content.split('\n');
    let inServices = false;
    let indent = 0;

    for (const line of lines) {
      if (line.match(/^services:/)) {
        inServices = true;
        indent = 0;
        continue;
      }

      if (inServices) {
        const serviceMatch = line.match(/^(\s*)(\w+):/);
        if (serviceMatch) {
          const currentIndent = serviceMatch[1].length;
          if (currentIndent === 2 || (indent === 0 && currentIndent > 0)) {
            indent = currentIndent;
            services.push(serviceMatch[2]);
          } else if (currentIndent === 0 && serviceMatch[2] !== 'services') {
            inServices = false;
          }
        }
      }
    }

    return services;
  }

  private extractServiceConfig(
    content: string,
    serviceName: string
  ): Omit<DockerService, 'composeFile'> | null {
    const serviceRegex = new RegExp(
      `${serviceName}:[\\s\\S]*?(?=\\n\\s*\\w+:|$)`,
      'm'
    );
    const match = content.match(serviceRegex);
    if (!match) return null;

    const serviceBlock = match[0];
    const imageMatch = serviceBlock.match(/image:\s*([^\n]+)/);
    const portsMatch = serviceBlock.match(/ports:\s*\n((?:\s+-[^\n]+\n?)+)/);

    const ports: string[] = [];
    if (portsMatch) {
      const portLines = portsMatch[1].match(/-\s*['"]?(\d+(?::\d+)?)['"]?/g);
      if (portLines) {
        for (const p of portLines) ports.push(p.replace(/[-\s'"]/g, ''));
      }
    }

    return {
      name: serviceName,
      image: imageMatch?.[1]?.trim() || 'unknown',
      ports,
    };
  }

  private async analyzeKubernetes(
    basePath: string
  ): Promise<KubernetesAnalysis> {
    const helmCharts: HelmChart[] = [];
    const manifests: K8sManifest[] = [];
    const namespaces = new Set<string>();

    const chartFiles = await glob('**/Chart.yaml', {
      cwd: basePath,
      ignore: ['**/node_modules/**'],
    });

    for (const file of chartFiles) {
      const fullPath = path.join(basePath, file);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const nameMatch = content.match(/name:\s*(\S+)/);
        const versionMatch = content.match(/version:\s*(\S+)/);
        const depsMatch = content.matchAll(/- name:\s*(\S+)/g);

        helmCharts.push({
          name: nameMatch?.[1] || 'unknown',
          path: path.dirname(fullPath),
          version: versionMatch?.[1] || '0.0.0',
          dependencies: Array.from(depsMatch).map((m) => m[1]),
        });
      } catch {}
    }

    const k8sPatterns = await glob('**/*.{yaml,yml}', {
      cwd: basePath,
      ignore: ['**/node_modules/**', '**/docker-compose*'],
    });

    for (const file of k8sPatterns) {
      const fullPath = path.join(basePath, file);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');

        if (!content.includes('apiVersion:') || !content.includes('kind:'))
          continue;

        const kindMatch = content.match(/kind:\s*(\S+)/);
        const nameMatch = content.match(/metadata:\s*\n\s*name:\s*(\S+)/);
        const nsMatch = content.match(/namespace:\s*(\S+)/);

        if (kindMatch) {
          manifests.push({
            path: fullPath,
            kind: kindMatch[1],
            name: nameMatch?.[1] || 'unknown',
          });

          if (nsMatch) namespaces.add(nsMatch[1]);
        }
      } catch {}
    }

    return {
      helmCharts,
      manifests,
      namespaces: Array.from(namespaces),
    };
  }

  private async analyzeMonitoring(
    basePath: string
  ): Promise<MonitoringAnalysis> {
    const healthChecks: HealthCheck[] = [];
    const metricsEndpoints: string[] = [];

    let prometheus = false;
    let grafana = false;
    let sentry = false;
    let datadog = false;

    const allFiles = await glob('**/*.{js,ts,yaml,yml,json}', {
      cwd: basePath,
      ignore: ['**/node_modules/**', '**/dist/**'],
    });

    for (const file of allFiles) {
      const fullPath = path.join(basePath, file);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');

        if (content.includes('prometheus') || content.includes('prom-client'))
          prometheus = true;
        if (content.includes('grafana')) grafana = true;
        if (content.includes('@sentry') || content.includes('sentry'))
          sentry = true;
        if (content.includes('datadog') || content.includes('dd-trace'))
          datadog = true;

        const metricsMatch = content.match(/['"`]\/metrics['"`]/g);
        if (metricsMatch) metricsEndpoints.push(fullPath);

        const healthMatch = content.match(
          /['"`]\/(health|healthz|ready|readyz|live|livez)['"`]/g
        );
        if (healthMatch) {
          for (const h of healthMatch) {
            const endpoint = h.replace(/['"`]/g, '');
            const type = endpoint.includes('ready')
              ? 'readiness'
              : endpoint.includes('live')
                ? 'liveness'
                : 'startup';
            healthChecks.push({ path: fullPath, type, endpoint });
          }
        }
      } catch {}
    }

    return {
      prometheus,
      grafana,
      sentry,
      datadog,
      healthChecks,
      metricsEndpoints,
    };
  }

  private async analyzeCiCd(basePath: string): Promise<CiCdAnalysis> {
    const workflows: CiCdWorkflow[] = [];
    let provider: CiCdAnalysis['provider'] = 'none';

    const githubWorkflows = await glob('.github/workflows/*.{yml,yaml}', {
      cwd: basePath,
    });
    if (githubWorkflows.length > 0) {
      provider = 'github-actions';
      for (const file of githubWorkflows) {
        const fullPath = path.join(basePath, file);
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const nameMatch = content.match(/name:\s*(.+)/);
          const triggers = this.extractTriggers(content);
          const jobs = this.extractJobs(content);

          workflows.push({
            name: nameMatch?.[1]?.trim() || path.basename(file),
            path: fullPath,
            triggers,
            jobs,
          });
        } catch {
          // Skip files that can't be read
        }
      }
    }

    const gitlabCi = await glob('.gitlab-ci.yml', { cwd: basePath });
    if (gitlabCi.length > 0) provider = 'gitlab-ci';

    const jenkinsFile = await glob('Jenkinsfile', { cwd: basePath });
    if (jenkinsFile.length > 0) provider = 'jenkins';

    return { workflows, provider };
  }

  private extractTriggers(content: string): string[] {
    const triggers: string[] = [];
    const onMatch = content.match(/on:\s*\n((?:\s+\w+[:\n]?)+)/);
    if (onMatch) {
      const lines = onMatch[1].split('\n');
      for (const line of lines) {
        const trigger = line.trim().replace(':', '');
        if (trigger && !trigger.includes(' ')) triggers.push(trigger);
      }
    }
    return triggers;
  }

  private extractJobs(content: string): string[] {
    const jobs: string[] = [];
    const jobsMatch = content.match(/jobs:\s*\n((?:\s+\w+:\s*\n[\s\S]*?)+)/);
    if (jobsMatch) {
      const matches = jobsMatch[1].matchAll(/^\s{2}(\w+):/gm);
      for (const match of matches) {
        jobs.push(match[1]);
      }
    }
    return jobs;
  }

  private calculateScore(
    docker: DockerAnalysis,
    kubernetes: KubernetesAnalysis,
    monitoring: MonitoringAnalysis,
    cicd: CiCdAnalysis
  ): number {
    let score = 40;

    if (docker.composeFiles.length > 0) score += 10;
    if (docker.dockerfiles.length > 0) score += 5;
    if (docker.services.length >= 3) score += 5;

    if (kubernetes.helmCharts.length > 0) score += 10;
    if (kubernetes.manifests.length > 0) score += 5;

    if (monitoring.prometheus) score += 5;
    if (monitoring.grafana) score += 5;
    if (monitoring.sentry) score += 3;
    if (monitoring.healthChecks.length > 0) score += 5;

    if (cicd.provider !== 'none') score += 7;

    return Math.min(100, score);
  }
}
