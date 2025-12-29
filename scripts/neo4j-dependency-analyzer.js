/**
 * Neo4j Dependency Graph Analyzer
 * Multi-level analysis: Atomic → Molecular → Association
 * Uses graph theory to evaluate system architecture
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Analysis levels based on finite element methodology
 */
const ANALYSIS_LEVELS = {
  ATOMIC: {
    name: 'Atomic Level',
    description: 'Individual files, functions, and components',
    granularity: 'file',
    metrics: ['complexity', 'dependencies', 'cohesion']
  },
  MOLECULAR: {
    name: 'Molecular Level', 
    description: 'Modules, packages, and subsystems',
    granularity: 'module',
    metrics: ['coupling', 'modularity', 'interface_quality']
  },
  ASSOCIATION: {
    name: 'Association Level',
    description: 'System-wide patterns and architectural relationships',
    granularity: 'system',
    metrics: ['architecture_quality', 'scalability', 'maintainability']
  }
};

/**
 * Graph database connection helper
 */
class Neo4jConnector {
  constructor(uri = 'bolt://localhost:7687', user = 'neo4j', password = 'password') {
    this.uri = uri;
    this.user = user;
    this.password = password;
  }

  async executeCypher(query) {
    try {
      const cmd = `cypher-shell -a ${this.uri} -u ${this.user} -p ${this.password} "${query.replace(/"/g, '\\"')}"`;
      const result = await execAsync(cmd);
      return this.parseResults(result.stdout);
    } catch (error) {
      // Fallback to in-memory graph if Neo4j not available
      console.warn('Neo4j not available, using in-memory graph');
      return null;
    }
  }

  parseResults(stdout) {
    const lines = stdout.trim().split('\n');
    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return line;
      }
    });
  }
}

/**
 * In-memory graph for analysis when Neo4j unavailable
 */
class InMemoryGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
  }

  addNode(id, type, properties = {}) {
    this.nodes.set(id, { id, type, properties });
  }

  addEdge(from, to, relationship, properties = {}) {
    this.edges.push({ from, to, relationship, properties });
  }

  getNode(id) {
    return this.nodes.get(id);
  }

  getNeighbors(id) {
    return this.edges.filter(e => e.from === id || e.to === id);
  }

  getDegree(id) {
    return this.getNeighbors(id).length;
  }

  getConnectedComponents() {
    const visited = new Set();
    const components = [];

    for (const [id] of this.nodes) {
      if (!visited.has(id)) {
        const component = this.dfs(id, visited);
        components.push(component);
      }
    }

    return components;
  }

  dfs(start, visited) {
    const stack = [start];
    const component = [];

    while (stack.length > 0) {
      const current = stack.pop();
      if (visited.has(current)) continue;

      visited.add(current);
      component.push(current);

      const neighbors = this.getNeighbors(current);
      for (const edge of neighbors) {
        const next = edge.from === current ? edge.to : edge.from;
        if (!visited.has(next)) {
          stack.push(next);
        }
      }
    }

    return component;
  }

  calculateCentrality() {
    const centrality = new Map();
    
    for (const [id] of this.nodes) {
      centrality.set(id, this.getDegree(id));
    }

    return centrality;
  }

  calculateBetweenness() {
    // Simplified betweenness centrality
    const betweenness = new Map();
    
    for (const [id] of this.nodes) {
      betweenness.set(id, 0);
    }

    // For each pair of nodes, find shortest paths
    for (const [source] of this.nodes) {
      for (const [target] of this.nodes) {
        if (source === target) continue;
        
        const paths = this.findAllShortestPaths(source, target);
        for (const path of paths) {
          for (let i = 1; i < path.length - 1; i++) {
            const current = betweenness.get(path[i]) || 0;
            betweenness.set(path[i], current + 1 / paths.length);
          }
        }
      }
    }

    return betweenness;
  }

  findAllShortestPaths(source, target) {
    const queue = [[source]];
    const visited = new Set();
    const paths = [];
    let shortestLength = Infinity;

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (path.length > shortestLength) break;

      if (current === target) {
        if (path.length < shortestLength) {
          shortestLength = path.length;
          paths.length = 0;
        }
        paths.push([...path]);
        continue;
      }

      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = this.getNeighbors(current);
      for (const edge of neighbors) {
        const next = edge.from === current ? edge.to : edge.from;
        if (!path.includes(next)) {
          queue.push([...path, next]);
        }
      }
    }

    return paths;
  }
}

/**
 * Build dependency graph from codebase
 */
async function buildDependencyGraph(rootDir) {
  const graph = new InMemoryGraph();
  
  console.log('\n📊 Building dependency graph...\n');

  // Atomic level: Scan files
  const files = await scanDirectory(rootDir);
  
  for (const file of files) {
    const fileId = path.relative(rootDir, file);
    const ext = path.extname(file);
    const type = classifyFile(ext);
    
    graph.addNode(fileId, 'FILE', {
      path: file,
      extension: ext,
      type,
      level: 'ATOMIC'
    });
  }

  // Molecular level: Analyze imports/dependencies
  for (const file of files) {
    const fileId = path.relative(rootDir, file);
    const dependencies = await extractDependencies(file);
    
    for (const dep of dependencies) {
      graph.addEdge(fileId, dep, 'IMPORTS', { level: 'MOLECULAR' });
    }
  }

  // Association level: Identify modules and subsystems
  const modules = identifyModules(graph);
  
  for (const module of modules) {
    graph.addNode(module.id, 'MODULE', {
      files: module.files,
      level: 'ASSOCIATION'
    });
    
    for (const file of module.files) {
      graph.addEdge(module.id, file, 'CONTAINS', { level: 'ASSOCIATION' });
    }
  }

  return graph;
}

/**
 * Scan directory for source files
 */
async function scanDirectory(dir, extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs']) {
  const files = [];
  
  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      // Skip node_modules, .git, etc.
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}

/**
 * Classify file by extension
 */
function classifyFile(ext) {
  const types = {
    '.js': 'JavaScript',
    '.ts': 'TypeScript',
    '.jsx': 'React',
    '.tsx': 'React',
    '.py': 'Python',
    '.java': 'Java',
    '.go': 'Go',
    '.rs': 'Rust'
  };
  return types[ext] || 'Unknown';
}

/**
 * Extract dependencies from source file
 */
async function extractDependencies(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const dependencies = new Set();
    
    // JavaScript/TypeScript imports
    const importRegex = /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      dependencies.add(match[1]);
    }
    
    // Python imports
    const pythonImportRegex = /^(?:from|import)\s+([^\s]+)/gm;
    while ((match = pythonImportRegex.exec(content)) !== null) {
      dependencies.add(match[1]);
    }
    
    return Array.from(dependencies);
  } catch (error) {
    return [];
  }
}

/**
 * Identify modules from file groups
 */
function identifyModules(graph) {
  const modules = [];
  const components = graph.getConnectedComponents();
  
  for (let i = 0; i < components.length; i++) {
    const files = components[i].filter(id => {
      const node = graph.getNode(id);
      return node && node.type === 'FILE';
    });
    
    if (files.length > 0) {
      modules.push({
        id: `MODULE_${i}`,
        files,
        size: files.length
      });
    }
  }
  
  return modules;
}

/**
 * Analyze graph using finite element methodology
 */
function analyzeGraphStructure(graph) {
  console.log('\n🔬 Performing finite element analysis on dependency graph...\n');
  
  const analysis = {
    atomic: analyzeAtomicLevel(graph),
    molecular: analyzeMolecularLevel(graph),
    association: analyzeAssociationLevel(graph)
  };
  
  return analysis;
}

/**
 * Atomic level analysis
 */
function analyzeAtomicLevel(graph) {
  const files = Array.from(graph.nodes.values()).filter(n => n.type === 'FILE');
  const centrality = graph.calculateCentrality();
  
  return {
    totalFiles: files.length,
    fileTypes: countByType(files),
    highCentralityNodes: findTopNodes(centrality, 10),
    averageDependencies: calculateAverageDegree(graph, 'FILE')
  };
}

/**
 * Molecular level analysis
 */
function analyzeMolecularLevel(graph) {
  const modules = Array.from(graph.nodes.values()).filter(n => n.type === 'MODULE');
  const betweenness = graph.calculateBetweenness();
  
  return {
    totalModules: modules.length,
    criticalConnectors: findTopNodes(betweenness, 5),
    moduleCoupling: calculateCoupling(graph),
    cohesionScore: calculateCohesion(graph)
  };
}

/**
 * Association level analysis
 */
function analyzeAssociationLevel(graph) {
  const components = graph.getConnectedComponents();
  
  return {
    connectedComponents: components.length,
    largestComponent: Math.max(...components.map(c => c.length)),
    componentSizes: components.map(c => c.length).sort((a, b) => b - a),
    architecturalComplexity: calculateComplexity(graph),
    modularityScore: calculateModularity(graph)
  };
}

/**
 * Helper functions for graph metrics
 */
function countByType(nodes) {
  const counts = {};
  for (const node of nodes) {
    const type = node.properties.type || 'Unknown';
    counts[type] = (counts[type] || 0) + 1;
  }
  return counts;
}

function findTopNodes(map, n) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, value]) => ({ id, value }));
}

function calculateAverageDegree(graph, type) {
  const nodes = Array.from(graph.nodes.values()).filter(n => n.type === type);
  if (nodes.length === 0) return 0;
  
  const totalDegree = nodes.reduce((sum, node) => sum + graph.getDegree(node.id), 0);
  return totalDegree / nodes.length;
}

function calculateCoupling(graph) {
  // Simplified coupling metric
  const edges = graph.edges.filter(e => e.relationship === 'IMPORTS');
  const nodes = graph.nodes.size;
  
  if (nodes <= 1) return 0;
  
  const maxEdges = nodes * (nodes - 1);
  return edges.length / maxEdges;
}

function calculateCohesion(graph) {
  // Simplified cohesion: ratio of internal to external dependencies
  const components = graph.getConnectedComponents();
  
  if (components.length === 0) return 0;
  
  let totalCohesion = 0;
  
  for (const component of components) {
    const internalEdges = graph.edges.filter(e => 
      component.includes(e.from) && component.includes(e.to)
    ).length;
    
    const externalEdges = graph.edges.filter(e =>
      (component.includes(e.from) && !component.includes(e.to)) ||
      (!component.includes(e.from) && component.includes(e.to))
    ).length;
    
    const cohesion = internalEdges / (internalEdges + externalEdges + 1);
    totalCohesion += cohesion;
  }
  
  return totalCohesion / components.length;
}

function calculateComplexity(graph) {
  // Cyclomatic complexity based on graph structure
  const edges = graph.edges.length;
  const nodes = graph.nodes.size;
  const components = graph.getConnectedComponents().length;
  
  return edges - nodes + 2 * components;
}

function calculateModularity(graph) {
  // Simplified modularity score
  const components = graph.getConnectedComponents();
  const totalEdges = graph.edges.length;
  
  if (totalEdges === 0) return 0;
  
  let modularity = 0;
  
  for (const component of components) {
    const internalEdges = graph.edges.filter(e =>
      component.includes(e.from) && component.includes(e.to)
    ).length;
    
    modularity += internalEdges / totalEdges;
  }
  
  return modularity;
}

/**
 * Main graph analysis orchestrator
 */
export async function performGraphAnalysis(rootDir = '.') {
  const startTime = Date.now();
  
  console.log('🔗 Neo4j Dependency Graph Analysis\n');
  console.log('═'.repeat(60));
  
  // Build graph
  const graph = await buildDependencyGraph(rootDir);
  
  console.log(`\n✅ Graph built: ${graph.nodes.size} nodes, ${graph.edges.length} edges\n`);
  
  // Analyze
  const analysis = analyzeGraphStructure(graph);
  
  // Calculate scores
  const scores = calculateGraphScores(analysis);
  
  return {
    metadata: {
      timestamp: new Date().toISOString(),
      rootDirectory: rootDir,
      analysisLevels: Object.keys(ANALYSIS_LEVELS),
      duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
    },
    graphStats: {
      nodes: graph.nodes.size,
      edges: graph.edges.length,
      density: graph.edges.length / (graph.nodes.size * (graph.nodes.size - 1))
    },
    analysis,
    scores,
    graph: serializeGraph(graph)
  };
}

/**
 * Calculate numerical scores from graph analysis
 */
function calculateGraphScores(analysis) {
  return {
    atomic: {
      diversityScore: calculateDiversityScore(analysis.atomic.fileTypes),
      balanceScore: calculateBalanceScore(analysis.atomic.highCentralityNodes),
      healthScore: 1 - Math.min(1, analysis.atomic.averageDependencies / 20)
    },
    molecular: {
      couplingScore: 1 - analysis.molecular.moduleCoupling,
      cohesionScore: analysis.molecular.cohesionScore,
      modularityScore: analysis.molecular.cohesionScore // Simplified
    },
    association: {
      componentScore: 1 / (1 + analysis.association.connectedComponents / 10),
      complexityScore: 1 - Math.min(1, analysis.association.architecturalComplexity / 100),
      modularityScore: analysis.association.modularityScore
    }
  };
}

function calculateDiversityScore(fileTypes) {
  const total = Object.values(fileTypes).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  
  // Shannon entropy for diversity
  let entropy = 0;
  for (const count of Object.values(fileTypes)) {
    const p = count / total;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  
  // Normalize to 0-1
  const maxEntropy = Math.log2(Object.keys(fileTypes).length);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

function calculateBalanceScore(topNodes) {
  if (topNodes.length === 0) return 1;
  
  const values = topNodes.map(n => n.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  
  if (max === 0) return 1;
  
  return 1 - (max - min) / max;
}

function serializeGraph(graph) {
  return {
    nodes: Array.from(graph.nodes.entries()).map(([id, node]) => ({
      id,
      ...node
    })),
    edges: graph.edges
  };
}

export { InMemoryGraph, buildDependencyGraph, analyzeGraphStructure };
