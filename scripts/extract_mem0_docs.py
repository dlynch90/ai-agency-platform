#!/usr/bin/env python3
"""
Mem0.ai Documentation Extractor

Uses Playwright MCP server to navigate to mem0.ai and extract documentation
for integration purposes.

This script extracts:
- API documentation
- SDK installation guides
- Integration examples
- Configuration options
- Vector store integrations
- LLM provider support
"""

import asyncio
import json
import os
from pathlib import Path
from typing import Dict, List, Any
import sys

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
except ImportError:
    print("Error: MCP client not available. Installing...")
    os.system("pip install mcp")
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

class Mem0DocsExtractor:
    def __init__(self):
        self.docs_dir = Path(__file__).parent.parent / "docs" / "integrations" / "mem0-ai"
        self.extracted_data = {}

    def extract_tool_result_content(self, result) -> Dict[str, Any]:
        """Extract serializable content from MCP tool result"""
        try:
            if hasattr(result, 'content'):
                # Handle MCP CallToolResult
                content = []
                for item in result.content:
                    if hasattr(item, 'type') and hasattr(item, 'text'):
                        content.append({
                            "type": item.type,
                            "text": item.text
                        })
                    else:
                        content.append(str(item))
                return {"content": content}
            else:
                # Fallback for other result types
                return {"result": str(result)}
        except Exception as e:
            return {"error": f"Failed to extract content: {str(e)}", "raw_result": str(result)}

    async def extract_with_available_tools(self, session: ClientSession, available_tools: List[str]) -> Dict[str, Any]:
        """Extract information using whatever tools are available"""
        extracted_info = {}

        # Try different extraction approaches based on available tools
        useful_tools = [
            ("browser_take_screenshot", {}),
            ("browser_snapshot", {}),
            ("browser_evaluate", {"script": "document.title"}),
            ("browser_evaluate", {"script": "document.body.innerText.substring(0, 2000)"}),
            ("browser_evaluate", {"script": "Array.from(document.querySelectorAll('a')).map(a => ({text: a.textContent, href: a.href})).slice(0, 20)"}),
            ("browser_evaluate", {"script": "Array.from(document.querySelectorAll('code, pre')).map(el => el.textContent).join('\\n---\\n').substring(0, 3000)"}),
        ]

        for tool_name, params in useful_tools:
            if tool_name in available_tools:
                try:
                    result = await session.call_tool(tool_name, params)
                    extracted_info[tool_name] = self.extract_tool_result_content(result)
                    print(f"✅ Extracted data using {tool_name}")
                except Exception as e:
                    extracted_info[f"{tool_name}_error"] = str(e)
                    print(f"❌ Failed to use {tool_name}: {e}")

        # If no tools worked, provide fallback
        if not extracted_info:
            extracted_info["fallback_message"] = "No suitable browser tools worked. Consider manual documentation review."

        return extracted_info

    async def extract_mem0_documentation(self):
        """Extract documentation from mem0.ai using Playwright MCP server"""

        print("🚀 Starting Mem0.ai documentation extraction...")

        # MCP server parameters for Playwright
        server_params = StdioServerParameters(
            command="npx",
            args=["-y", "@playwright/mcp"],
            env=dict(os.environ)
        )

        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                # Initialize the session
                await session.initialize()

                # List available tools first
                tools_result = await session.list_tools()
                available_tools = [tool.name for tool in tools_result.tools]
                print(f"📋 Available Playwright tools: {available_tools}")

                print("📖 Navigating to mem0.ai...")

                # Try to navigate using available tools
                if "browser_navigate" in available_tools:
                    navigate_result = await session.call_tool("browser_navigate", {
                        "url": "https://mem0.ai"
                    })
                    print("✅ Successfully navigated to mem0.ai")
                else:
                    print("⚠️  browser_navigate tool not available, trying alternative approach")

                # Extract information using available tools
                extracted_info = await self.extract_with_available_tools(session, available_tools)

                # Compile extracted data
                self.extracted_data = {
                    "available_tools": available_tools,
                    "navigation_result": navigate_result if "playwright_navigate" in available_tools else None,
                    "extracted_info": extracted_info,
                    "metadata": {
                        "extraction_date": "2024-12-28",
                        "source_url": "https://mem0.ai",
                        "extractor_version": "2.0.0"
                    }
                }

                # Save extracted data
                await self.save_extracted_data()

                print("✅ Documentation extraction completed!")
                return self.extracted_data

    async def extract_docs_sections(self, session: ClientSession) -> Dict[str, Any]:
        """Extract main documentation sections from the website"""

        sections = {}

        try:
            # Try to find documentation links
            docs_links_result = await session.call_tool("playwright_find_elements", {
                "selector": "a[href*='docs'], a[href*='documentation'], a[href*='api']"
            })
            sections["documentation_links"] = self.extract_tool_result_content(docs_links_result)

            # Extract header content
            header_content_result = await session.call_tool("playwright_get_content", {
                "selector": "header, .header, nav"
            })
            sections["header"] = self.extract_tool_result_content(header_content_result)

            # Extract main content areas
            main_content_result = await session.call_tool("playwright_get_content", {
                "selector": "main, .main-content, #content"
            })
            sections["main_content"] = self.extract_tool_result_content(main_content_result)

        except Exception as e:
            sections["error"] = f"Failed to extract docs sections: {str(e)}"

        return sections

    async def extract_api_docs(self, session: ClientSession) -> Dict[str, Any]:
        """Extract API documentation"""

        api_docs = {}

        try:
            # Try to navigate to API docs if link exists
            api_link_result = await session.call_tool("playwright_find_elements", {
                "selector": "a[href*='api'], a[href*='docs/api']"
            })
            api_link = self.extract_tool_result_content(api_link_result)

            if api_link and api_link.get("content"):
                # Click on API docs link
                await session.call_tool("playwright_click", {
                    "selector": "a[href*='api']"
                })

                # Extract API documentation content
                api_content_result = await session.call_tool("playwright_get_content", {
                    "selector": "body"
                })
                api_docs["api_reference"] = self.extract_tool_result_content(api_content_result)

                # Go back to main page
                await session.call_tool("playwright_navigate", {
                    "url": "https://mem0.ai"
                })
            else:
                api_docs["message"] = "No API documentation links found on main page"

        except Exception as e:
            print(f"Warning: Could not extract API docs: {e}")
            api_docs["error"] = str(e)

        return api_docs

    async def extract_sdk_info(self, session: ClientSession) -> Dict[str, Any]:
        """Extract SDK installation and usage information"""

        sdk_info = {}

        try:
            # Look for SDK sections
            sdk_sections_result = await session.call_tool("playwright_find_elements", {
                "selector": "[class*='sdk'], [id*='sdk'], [class*='install'], [id*='install']"
            })
            sdk_info["sdk_sections"] = self.extract_tool_result_content(sdk_sections_result)

            # Extract code examples
            code_blocks_result = await session.call_tool("playwright_find_elements", {
                "selector": "code, pre, .code-block"
            })
            sdk_info["code_examples"] = self.extract_tool_result_content(code_blocks_result)

        except Exception as e:
            print(f"Warning: Could not extract SDK info: {e}")
            sdk_info["error"] = str(e)

        return sdk_info

    async def extract_integration_examples(self, session: ClientSession) -> Dict[str, Any]:
        """Extract integration examples and guides"""

        integration_examples = {}

        try:
            # Look for integration or examples sections
            integration_links_result = await session.call_tool("playwright_find_elements", {
                "selector": "a[href*='integrat'], a[href*='example'], a[href*='guide']"
            })
            integration_examples["integration_links"] = self.extract_tool_result_content(integration_links_result)

            # Extract tutorial content
            tutorial_content_result = await session.call_tool("playwright_find_elements", {
                "selector": "[class*='tutorial'], [class*='example'], [class*='guide']"
            })
            integration_examples["tutorials"] = self.extract_tool_result_content(tutorial_content_result)

        except Exception as e:
            print(f"Warning: Could not extract integration examples: {e}")
            integration_examples["error"] = str(e)

        return integration_examples

    async def save_extracted_data(self):
        """Save extracted documentation to files"""

        # Ensure docs directory exists
        self.docs_dir.mkdir(parents=True, exist_ok=True)

        # Save main extracted data as JSON
        main_file = self.docs_dir / "extracted_documentation.json"
        with open(main_file, 'w', encoding='utf-8') as f:
            json.dump(self.extracted_data, f, indent=2, ensure_ascii=False)

        # Save individual sections as markdown files
        await self.save_as_markdown()

        print(f"📁 Documentation saved to {self.docs_dir}")

    async def save_as_markdown(self):
        """Convert extracted data to readable markdown files"""

        # Create README.md with overview
        readme_content = f"""# Mem0.ai Integration Documentation

Extracted from [mem0.ai](https://mem0.ai) on {self.extracted_data.get('metadata', {}).get('extraction_date', 'Unknown')}

## Overview

This documentation contains extracted information about Mem0.ai for integration purposes.

## Contents

- [API Documentation](api-reference.md)
- [SDK Information](sdk-guide.md)
- [Integration Examples](integration-examples.md)
- [Raw Extracted Data](extracted_documentation.json)

## Metadata

- **Source**: {self.extracted_data.get('metadata', {}).get('source_url', 'Unknown')}
- **Extractor Version**: {self.extracted_data.get('metadata', {}).get('extractor_version', 'Unknown')}
- **Extraction Date**: {self.extracted_data.get('metadata', {}).get('extraction_date', 'Unknown')}
"""

        readme_file = self.docs_dir / "README.md"
        with open(readme_file, 'w', encoding='utf-8') as f:
            f.write(readme_content)

        # Create API reference
        api_content = "# Mem0.ai API Reference\n\n"
        api_docs = self.extracted_data.get('api_docs', {})
        if api_docs:
            api_content += "## API Documentation\n\n"
            api_content += "```\n"
            api_content += json.dumps(api_docs, indent=2)
            api_content += "\n```\n"
        else:
            api_content += "No API documentation extracted.\n"

        api_file = self.docs_dir / "api-reference.md"
        with open(api_file, 'w', encoding='utf-8') as f:
            f.write(api_content)

        # Create SDK guide
        sdk_content = "# Mem0.ai SDK Guide\n\n"
        sdk_info = self.extracted_data.get('sdk_info', {})
        if sdk_info:
            sdk_content += "## SDK Information\n\n"
            sdk_content += "```\n"
            sdk_content += json.dumps(sdk_info, indent=2)
            sdk_content += "\n```\n"
        else:
            sdk_content += "No SDK information extracted.\n"

        sdk_file = self.docs_dir / "sdk-guide.md"
        with open(sdk_file, 'w', encoding='utf-8') as f:
            f.write(sdk_content)

        # Create integration examples
        integration_content = "# Mem0.ai Integration Examples\n\n"
        integration_examples = self.extracted_data.get('integration_examples', {})
        if integration_examples:
            integration_content += "## Integration Examples\n\n"
            integration_content += "```\n"
            integration_content += json.dumps(integration_examples, indent=2)
            integration_content += "\n```\n"
        else:
            integration_content += "No integration examples extracted.\n"

        integration_file = self.docs_dir / "integration-examples.md"
        with open(integration_file, 'w', encoding='utf-8') as f:
            f.write(integration_content)

async def main():
    """Main execution function"""
    extractor = Mem0DocsExtractor()
    try:
        result = await extractor.extract_mem0_documentation()
        print("🎉 Mem0.ai documentation extraction completed successfully!")
        return result
    except Exception as e:
        print(f"❌ Error during extraction: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())