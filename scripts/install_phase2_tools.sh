#!/bin/bash
# Phase 2 Tool Installation Script
# Installs additional tools for complete development environment
# Run after Phase 1 is complete

set -e

echo "🔄 Phase 2 Installation - Advanced Tools & Frameworks"
echo "====================================================="

echo "🎨 Installing UI/Design Frameworks..."
npm install @chakra-ui/react radix-vue tailwindcss aceternity-ui animata
npm install @builder.io/react @heroicons/react @radix-ui/react-dialog

echo ""
echo "🔐 Installing Authentication & Security..."
uv pip install python-jose[cryptography] passlib[bcrypt] fastapi-users
npm install @clerk/clerk-js @supabase/supabase-js
uv pip install pyjwt cryptography bcrypt

echo ""
echo "📈 Installing Advanced Analytics & ML..."
uv pip install scikit-learn xgboost lightgbm catboost
uv pip install statsmodels prophet pycaret
uv pip install transformers accelerate datasets
uv pip install diffusers stable-diffusion-pipelines

echo ""
echo "🌐 Installing API Clients & Integrations..."
uv pip install stripe slack-sdk discord.py twilio
uv pip install sendgrid mailgun-python
npm install @sendgrid/mail twilio @slack/web-api

echo ""
echo "🎯 Installing Specialized Libraries..."
uv pip install networkx community graph-tool
uv pip install geopandas folium plotly-geo
uv pip install librosa pydub soundfile
uv pip install opencv-python mediapipe

echo ""
echo "📊 Installing Business Intelligence..."
uv pip install tableau-api-lib powerbi python-pptx
npm install @superset-ui/core apache-superset

echo ""
echo "🏗️ Installing Infrastructure & DevOps Tools..."
brew install argocd fluxcd/tap/flux
brew install tektoncd-cli
uv pip install ansible ansible-core
brew install pulumi/tap/pulumi

echo ""
echo "🔍 Installing Code Analysis & Quality..."
npm install -g eslint-plugin-security @typescript-eslint/eslint-plugin
uv pip install pylint mypy pyright ruff-lsp
uv pip install pre-commit-hooks
npm install -g husky lint-staged

echo ""
echo "📝 Installing Documentation Tools..."
npm install -g docsify vuepress @vuepress/bundler-vite
uv pip install sphinx sphinx-rtd-theme mkdocs mkdocs-material
npm install -g @stoplight/spectral

echo ""
echo "🎮 Installing Game Development (Optional)..."
uv pip install pygame arcade pyglet
npm install three @react-three/fiber

echo ""
echo "✨ Phase 2 Installation Complete!"
echo "================================="
echo ""
echo "Additional Setup Required:"
echo "1. Configure authentication providers (Clerk, Supabase)"
echo "2. Set up API keys for cloud services"
echo "3. Configure ArgoCD/Flux for GitOps"
echo "4. Set up pre-commit hooks: pre-commit install"
echo "5. Initialize documentation: mkdocs new ."
echo ""
echo "🎯 Your development environment is now feature-complete!"