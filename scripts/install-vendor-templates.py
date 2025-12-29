#!/usr/bin/env python3
"""
Create Vendor Template Documentation
Creates template directories with documentation for vendor solutions
"""

import os
from pathlib import Path
from typing import Dict, List

class VendorTemplateCreator:
    """Creates vendor template directories with documentation"""

    def __init__(self, templates_dir: Path):
        self.templates_dir = templates_dir
        self.templates_dir.mkdir(parents=True, exist_ok=True)

        # Template configurations with documentation
        self.templates = {
            'langchain': {
                'description': 'LangChain AI agent and RAG templates',
                'installation': 'pip install langchain langchain-community langchain-openai',
                'usage': 'Use langchain CLI: langchain new project-name',
                'templates': ['basic-agent', 'rag-application', 'chatbot', 'tool-using-agent'],
                'docs': '''
# LangChain Templates

Official LangChain templates for building AI applications.

## Installation
```bash
pip install langchain langchain-community langchain-openai
```

## Usage
```bash
# Create new LangChain project
npx create-langchain-app@latest my-app

# Or manually create from templates
langchain new project-name --template basic
```

## Available Templates
- **basic-agent**: Simple conversational agent
- **rag-application**: Retrieval-augmented generation app
- **chatbot**: Interactive chatbot with memory
- **tool-using-agent**: Agent that can use external tools

## Instead of Custom Code
Use these templates instead of writing custom:
- Agent orchestration logic
- RAG pipeline implementations
- Chatbot conversation flows
- Tool integration patterns
'''
            },
            'langgraph': {
                'description': 'LangGraph workflow orchestration templates',
                'installation': 'pip install langgraph',
                'usage': 'Use langgraph CLI or create from examples',
                'templates': ['basic-workflow', 'agent-supervisor', 'multi-agent-system'],
                'docs': '''
# LangGraph Templates

Workflow orchestration for complex AI agent systems.

## Installation
```bash
pip install langgraph langchain
```

## Usage
```bash
# Create from LangGraph examples
git clone https://github.com/langchain-ai/langgraph
cd langgraph/examples
```

## Available Templates
- **basic-workflow**: Simple state machine workflow
- **agent-supervisor**: Hierarchical agent management
- **multi-agent-system**: Complex multi-agent orchestration

## Instead of Custom Code
Use these templates instead of writing custom:
- Workflow state management
- Agent coordination logic
- Complex conversation flows
- Multi-agent communication protocols
'''
            },
            'fastapi': {
                'description': 'FastAPI web framework templates',
                'installation': 'pip install fastapi uvicorn',
                'usage': 'Use full-stack-fastapi-postgresql template',
                'templates': ['basic-api', 'full-stack-postgresql', 'microservice'],
                'docs': '''
# FastAPI Templates

High-performance async web API framework templates.

## Installation
```bash
pip install fastapi uvicorn
# For full-stack applications
pip install sqlalchemy alembic psycopg2
```

## Usage
```bash
# Use official FastAPI template
git clone https://github.com/tiangolo/full-stack-fastapi-postgresql
cd full-stack-fastapi-postgresql
```

## Available Templates
- **basic-api**: Simple REST API
- **full-stack-postgresql**: Complete app with database
- **microservice**: Microservice architecture

## Instead of Custom Code
Use these templates instead of writing custom:
- API route definitions
- Database models and migrations
- Authentication systems
- Request validation logic
'''
            },
            'nextjs': {
                'description': 'Next.js React framework templates',
                'installation': 'npx create-next-app@latest',
                'usage': 'npx create-next-app project-name',
                'templates': ['basic-app', 'blog-starter', 'commerce', 'dashboard'],
                'docs': '''
# Next.js Templates

React framework with server-side rendering and API routes.

## Installation
```bash
npx create-next-app@latest my-app
# Choose TypeScript, Tailwind, ESLint, App Router
```

## Usage
```bash
npx create-next-app@latest my-app --typescript --tailwind --eslint --app
```

## Available Templates
- **basic-app**: Simple Next.js application
- **blog-starter**: Blog with MDX support
- **commerce**: E-commerce application
- **dashboard**: Admin dashboard

## Instead of Custom Code
Use these templates instead of writing custom:
- React component architecture
- API route handlers
- Authentication flows
- State management solutions
'''
            },
            'temporal': {
                'description': 'Temporal workflow orchestration templates',
                'installation': 'npm install @temporalio/client @temporalio/worker',
                'usage': 'Use temporal CLI: temporal new workflow-name',
                'templates': ['basic-workflow', 'subscription-workflow', 'saga-pattern'],
                'docs': '''
# Temporal Templates

Durable workflow orchestration engine.

## Installation
```bash
npm install @temporalio/client @temporalio/worker
# Or use Go/Java SDKs
```

## Usage
```bash
# Create new Temporal project
npx @temporalio/create@latest my-workflow
```

## Available Templates
- **basic-workflow**: Simple workflow with activities
- **subscription-workflow**: Subscription management
- **saga-pattern**: Distributed transactions

## Instead of Custom Code
Use these templates instead of writing custom:
- Workflow state machines
- Retry and timeout logic
- Distributed transaction coordination
- Long-running process management
'''
            }
        }

    def create_template_documentation(self) -> Dict[str, bool]:
        """Create template documentation directories"""
        print("📚 Creating vendor template documentation...")

        results = {}

        for template_name, template_config in self.templates.items():
            print(f"📝 Creating {template_name} documentation...")

            try:
                # Create template directory
                template_dir = self.templates_dir / template_name
                template_dir.mkdir(parents=True, exist_ok=True)

                # Create README with documentation
                readme_path = template_dir / 'README.md'
                with open(readme_path, 'w') as f:
                    f.write(f"# {template_name.title()} Vendor Templates\n\n")
                    f.write(f"{template_config['description']}\n\n")
                    f.write("## Installation\n\n")
                    f.write(f"```bash\n{template_config['installation']}\n```\n\n")
                    f.write("## Usage\n\n")
                    f.write(f"```bash\n{template_config['usage']}\n```\n\n")
                    f.write("## Available Templates\n\n")
                    for template in template_config['templates']:
                        f.write(f"- **{template}**\n")
                    f.write("\n")
                    f.write(template_config['docs'])

                # Create .gitkeep to ensure directory is tracked
                gitkeep_path = template_dir / '.gitkeep'
                with open(gitkeep_path, 'w') as f:
                    f.write("# This directory contains vendor template documentation\n")

                results[template_name] = True
                print(f"  ✅ {template_name} documentation created")

            except Exception as e:
                print(f"  ❌ Failed to create {template_name}: {e}")
                results[template_name] = False

        # Generate summary
        self._generate_summary(results)

        return results

    def _generate_summary(self, results: Dict):
        """Generate documentation summary"""
        self.templates_dir.mkdir(parents=True, exist_ok=True)
        summary_file = self.templates_dir / 'INSTALLATION_SUMMARY.md'

        with open(summary_file, 'w') as f:
            f.write("# Vendor Templates Documentation Summary\n\n")

            total_created = sum(1 for r in results.values() if r)
            total_failed = sum(1 for r in results.values() if not r)

            f.write("This directory contains documentation and guidance for using official vendor templates.\n")
            f.write("Instead of writing custom code, use these vendor-provided solutions.\n\n")

            f.write("## Available Template Documentation\n\n")

            for template_name, success in results.items():
                status = "✅" if success else "❌"
                f.write(f"- {status} **{template_name.title()}**: {self.templates[template_name]['description']}\n")

            f.write("\n## Summary\n\n")
            f.write(f"- **Total Documentation Created:** {total_created}\n")
            f.write(f"- **Total Failed:** {total_failed}\n")
            f.write(f"- **Success Rate:** {total_created/max(total_created+total_failed, 1)*100:.1f}%\n\n")

            f.write("## How to Use These Templates\n\n")
            f.write("1. **Read the README.md** in each template directory\n")
            f.write("2. **Follow the installation commands** provided\n")
            f.write("3. **Use the vendor CLI tools** instead of custom scripts\n")
            f.write("4. **Copy and customize** the vendor templates\n")
            f.write("5. **Avoid writing custom code** - use vendor solutions\n\n")

            f.write("## Template Categories\n\n")
            f.write("### AI/ML Frameworks\n")
            f.write("- **LangChain**: Agent orchestration and RAG\n")
            f.write("- **LangGraph**: Workflow orchestration for agents\n")
            f.write("- **CrewAI**: Multi-agent collaboration\n")
            f.write("- **AutoGen**: Multi-agent conversation frameworks\n\n")

            f.write("### Web Frameworks\n")
            f.write("- **FastAPI**: High-performance async Python APIs\n")
            f.write("- **Next.js**: React framework with SSR\n\n")

            f.write("### Workflow Engines\n")
            f.write("- **Temporal**: Durable workflow orchestration\n\n")

            f.write("## Compliance Benefits\n\n")
            f.write("- ✅ **Zero Custom Code**: Use vendor battle-tested solutions\n")
            f.write("- ✅ **Security**: Vendor security updates and patches\n")
            f.write("- ✅ **Maintenance**: Vendor handles updates and bug fixes\n")
            f.write("- ✅ **Community**: Large communities for support\n")
            f.write("- ✅ **Standards**: Follow industry best practices\n")

        print(f"📋 Documentation summary saved to {summary_file}")

def main():
    templates_dir = Path('templates/vendor')

    creator = VendorTemplateCreator(templates_dir)
    results = creator.create_template_documentation()

    print("\n🎉 Vendor Template Documentation Complete!")

    total_created = sum(1 for r in results.values() if r)
    total_failed = sum(1 for r in results.values() if not r)

    print(f"📚 Total documentation created: {total_created}")
    print(f"❌ Total failed: {total_failed}")
    print(f"📁 Templates location: {templates_dir}")

if __name__ == '__main__':
    main()