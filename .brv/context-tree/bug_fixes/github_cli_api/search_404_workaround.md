Used GitHub REST search via curl + gh token because `gh api /search/repositories` returned 404.

Command pattern:
```
TOKEN=$(gh auth token)
curl -sS -H "Accept: application/vnd.github+json" -H "Authorization: Bearer ${TOKEN}" \
  "https://api.github.com/search/repositories?q=<QUERY>&sort=stars&order=desc&per_page=5" \
  | jq -r '.items[] | "- \(.full_name) (⭐ \(.stargazers_count)) — \(.description // "")"'
```

Context: In this environment, `gh api` against `/search/repositories` and `https://api.github.com/search/repositories` returned HTTP 404, but direct curl with token succeeded.