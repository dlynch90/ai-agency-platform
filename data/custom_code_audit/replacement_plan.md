# Custom Code Replacement Plan

**Compliance Score: 25.1%**

**Total Violations: 493**

## Migrate To Npm Scripts

**Violations: 12**

### venv311/lib/python3.11/site-packages/jupyterlab/staging/yarn.js
- **Type:** node_utilities
- **Severity:** critical
- **Complexity:** 7.7
- **Alternative:** npm scripts
- **Dependencies:** None

### validate-mcp-servers.js
- **Type:** node_utilities
- **Severity:** critical
- **Complexity:** 7.1
- **Alternative:** npm scripts
- **Dependencies:** None

### validate-vendor-tools.js
- **Type:** node_utilities
- **Severity:** critical
- **Complexity:** 7.0
- **Alternative:** npm scripts
- **Dependencies:** child_process, path, fs

### validate-mcp-servers-fixed.js
- **Type:** node_utilities
- **Severity:** critical
- **Complexity:** 7.0
- **Alternative:** npm scripts
- **Dependencies:** None

### tools/javascript/cursor_debug_instrumentation.js.backup
- **Type:** node_utilities
- **Severity:** high
- **Complexity:** 5.9
- **Alternative:** npm scripts
- **Dependencies:** None

### scripts/debugging/cursor_debug_instrumentation.js.backup
- **Type:** node_utilities
- **Severity:** high
- **Complexity:** 5.9
- **Alternative:** npm scripts
- **Dependencies:** None

### closed-loop-analysis-framework.js
- **Type:** node_utilities
- **Severity:** high
- **Complexity:** 5.4
- **Alternative:** npm scripts
- **Dependencies:** None

### api-smoke-tests/smoke-test.js
- **Type:** node_utilities
- **Severity:** high
- **Complexity:** 5.0
- **Alternative:** npm scripts
- **Dependencies:** https, child_process, http

### tools/javascript/cursor_debug_instrumentation.js
- **Type:** node_utilities
- **Severity:** high
- **Complexity:** 4.9
- **Alternative:** npm scripts
- **Dependencies:** None

### scripts/debugging/cursor_debug_instrumentation.js
- **Type:** node_utilities
- **Severity:** high
- **Complexity:** 4.9
- **Alternative:** npm scripts
- **Dependencies:** None

## Migrate To Vendor Task Runners

**Violations: 268**

### domains/use-cases/01-ecommerce/final-verification.sh
- **Type:** shell_scripts
- **Severity:** critical
- **Complexity:** 10.0
- **Alternative:** npm scripts
- **Dependencies:** None

### scripts/validate-code.sh
- **Type:** shell_scripts
- **Severity:** critical
- **Complexity:** 9.5
- **Alternative:** npm scripts
- **Dependencies:** npm, npm, npm, git, git

### scripts/install-vendor-tools.sh.backup
- **Type:** shell_scripts
- **Severity:** critical
- **Complexity:** 9.4
- **Alternative:** npm scripts
- **Dependencies:** npm, npm, npm

### scripts/start-mcp-ecosystem.sh.backup
- **Type:** shell_scripts
- **Severity:** critical
- **Complexity:** 9.4
- **Alternative:** npm scripts
- **Dependencies:** None

### scripts/fix_environment.sh
- **Type:** shell_scripts
- **Severity:** critical
- **Complexity:** 9.4
- **Alternative:** npm scripts
- **Dependencies:** curl

### scripts/setup/fix_environment.sh
- **Type:** shell_scripts
- **Severity:** critical
- **Complexity:** 9.4
- **Alternative:** npm scripts
- **Dependencies:** curl

### scripts/start-mcp-ecosystem.sh
- **Type:** shell_scripts
- **Severity:** critical
- **Complexity:** 9.3
- **Alternative:** npm scripts
- **Dependencies:** None

### scripts/install-vendor-tools.sh
- **Type:** shell_scripts
- **Severity:** critical
- **Complexity:** 9.3
- **Alternative:** npm scripts
- **Dependencies:** npm, npm, npm

### scripts/debug_simple.sh.backup
- **Type:** shell_scripts
- **Severity:** critical
- **Complexity:** 9.3
- **Alternative:** npm scripts
- **Dependencies:** curl, git, git, git

### scripts/debugging/debug_simple.sh.backup
- **Type:** shell_scripts
- **Severity:** critical
- **Complexity:** 9.3
- **Alternative:** npm scripts
- **Dependencies:** curl, git, git, git

## Migrate To Cli Frameworks

**Violations: 203**

### tools/python/validate_installations.py.backup.backup
- **Type:** python_utilities
- **Severity:** critical
- **Complexity:** 10.0
- **Alternative:** click
- **Dependencies:** sys, typing, json, sklearn, mlflow

### tools/python/validate_installations.py
- **Type:** python_utilities
- **Severity:** critical
- **Complexity:** 10.0
- **Alternative:** click
- **Dependencies:** sys, typing, json, sklearn, mlflow

### tools/python/final-verification.py
- **Type:** python_utilities
- **Severity:** critical
- **Complexity:** 10.0
- **Alternative:** click
- **Dependencies:** pathlib, os

### tools/python/debug-use-cases.py
- **Type:** python_utilities
- **Severity:** critical
- **Complexity:** 10.0
- **Alternative:** click
- **Dependencies:** sys, json, datetime, pathlib, os

### scripts/validate_installations.py.backup
- **Type:** python_utilities
- **Severity:** critical
- **Complexity:** 10.0
- **Alternative:** click
- **Dependencies:** sys, typing, json, sklearn, mlflow

### scripts/fea-integration-pipeline.py
- **Type:** python_utilities
- **Severity:** critical
- **Complexity:** 10.0
- **Alternative:** click
- **Dependencies:** typing, json, datetime, pathlib, numpy

### scripts/analysis/final-verification.py
- **Type:** python_utilities
- **Severity:** critical
- **Complexity:** 10.0
- **Alternative:** click
- **Dependencies:** pathlib, os

### scripts/analysis/debug-use-cases.py
- **Type:** python_utilities
- **Severity:** critical
- **Complexity:** 10.0
- **Alternative:** click
- **Dependencies:** sys, json, datetime, pathlib, os

### venv311/lib/python3.11/site-packages/torch/utils/show_pickle.py
- **Type:** python_utilities
- **Severity:** critical
- **Complexity:** 10.0
- **Alternative:** click
- **Dependencies:** sys, typing, fnmatch, pprint, zipfile

### venv311/lib/python3.11/site-packages/numpy/testing/print_coercion_tables.py
- **Type:** python_utilities
- **Severity:** critical
- **Complexity:** 10.0
- **Alternative:** click
- **Dependencies:** collections, numpy

## Use Infrastructure Templates

**Violations: 4**

### venv311/lib/python3.11/site-packages/jupyter_lsp/specs/__init__.py
- **Type:** custom_docker
- **Severity:** high
- **Complexity:** 6.4
- **Alternative:** docker-compose templates
- **Dependencies:** None

### venv311/lib/python3.11/site-packages/notebook/static/2343.81357d860d7aa9156d23.js
- **Type:** custom_docker
- **Severity:** medium
- **Complexity:** 3.2
- **Alternative:** docker-compose templates
- **Dependencies:** None

### configs/.editorconfig
- **Type:** custom_docker
- **Severity:** medium
- **Complexity:** 2.3
- **Alternative:** docker-compose templates
- **Dependencies:** None

### venv311/lib/python3.11/site-packages/jupyter_lsp/specs/dockerfile_language_server_nodejs.py
- **Type:** custom_docker
- **Severity:** low
- **Complexity:** 1.9
- **Alternative:** docker-compose templates
- **Dependencies:** None

## Use Ci Cd Templates

**Violations: 1**

### configs/.gitignore
- **Type:** custom_ci_cd
- **Severity:** critical
- **Complexity:** 7.6
- **Alternative:** GitHub Actions templates
- **Dependencies:** None

## Use Vendor Config Libs

**Violations: 2**

### venv311/lib/python3.11/site-packages/jupyterlab/upgrade_extension.py
- **Type:** custom_config
- **Severity:** high
- **Complexity:** 5.6
- **Alternative:** cosmiconfig
- **Dependencies:** None

### configs/finite_element_gap_analysis_results.json
- **Type:** custom_config
- **Severity:** medium
- **Complexity:** 3.2
- **Alternative:** cosmiconfig
- **Dependencies:** None

## Use Framework Defaults

**Violations: 3**

### venv311/lib/python3.11/site-packages/jupyterlab/staging/webpack.config.js
- **Type:** custom_build
- **Severity:** high
- **Complexity:** 4.4
- **Alternative:** create-react-app
- **Dependencies:** None

### venv311/lib/python3.11/site-packages/jupyterlab/staging/webpack.prod.minimize.config.js
- **Type:** custom_build
- **Severity:** medium
- **Complexity:** 3.2
- **Alternative:** create-react-app
- **Dependencies:** None

### venv311/lib/python3.11/site-packages/jupyterlab/staging/webpack.prod.config.js
- **Type:** custom_build
- **Severity:** medium
- **Complexity:** 2.4
- **Alternative:** create-react-app
- **Dependencies:** None

