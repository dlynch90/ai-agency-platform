#!/usr/bin/env node

/**
 * CLEANED PIXI ML PACKAGES VERIFICATION
 * Post-fix verification that ML packages are available in default environment
 */

import { execSync } from 'child_process';

function verifyMLPackages() {
  console.log('🔬 VERIFYING PIXI ML PACKAGES ACTIVATION');
  console.log('=========================================');

  const packages = ['torch', 'torchvision', 'transformers', 'scikit-learn', 'optuna'];

  console.log('\n📦 Testing ML package availability in default environment:');
  console.log('');

  for (const pkg of packages) {
    try {
      const result = execSync(`pixi run python -c "import ${pkg}; print(f'${pkg}: {${pkg}.__version__}')"`, {
        encoding: 'utf8',
        timeout: 10000
      });

      console.log(`✅ ${pkg}: ${result.trim()}`);
    } catch (error) {
      console.log(`❌ ${pkg}: FAILED - ${error.message}`);
    }
  }

  console.log('');
  console.log('🎯 VERIFICATION COMPLETE');
}

verifyMLPackages();