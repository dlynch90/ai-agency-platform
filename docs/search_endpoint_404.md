GitHub CLI `gh api` returns 404 on search endpoints if invoked with `-f` (sends POST). Use GET with `-X GET` and `-F` for query params, or specify the query string in the URL. Example:
```
GH_PAGER=cat NO_COLOR=1 gh api -X GET /search/repositories -F q='org:microsoft playwright in:name,description' -F per_page=10 --jq '.items[] | .full_name'
```
This resolves the 404 and allows template discovery via the GitHub REST search API.