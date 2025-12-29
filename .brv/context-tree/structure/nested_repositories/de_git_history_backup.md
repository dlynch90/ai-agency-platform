De-git nested repos in `/Users/daniellynch/Developer` by bundling history and moving `.git` dirs to backups.

Backup report + bundles:
```
/Users/daniellynch/Developer/.backups/nested-git-20251219_030237/report.txt
/Users/daniellynch/Developer/.backups/nested-git-20251219_030237/bundles/*.bundle
/Users/daniellynch/Developer/.backups/nested-git-20251219_030237/git-dirs/*.git
```
Affected nested repos:
- `/Users/daniellynch/Developer/apps/api`
- `/Users/daniellynch/Developer/mcp-gateway/ansible-mcp`
- `/Users/daniellynch/Developer/shared/vendor-configs/google-ai/vertex-ai-samples`
- `/Users/daniellynch/Developer/shared/vendor-configs/google-ai/python-genai`
- `/Users/daniellynch/Developer/shared/vendor-configs/google-ai/python-aiplatform`

Method:
```
# create git bundles
git -C <repo> bundle create <bundle_path> --all

# move nested .git to backup
mv <repo>/.git <backup_gitdir>
```
This removes nested git repositories while preserving full history for later subtree/submodule import.