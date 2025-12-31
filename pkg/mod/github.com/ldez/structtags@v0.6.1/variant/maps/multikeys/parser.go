package multikeys

import "github.com/ldez/structtags/parser"

// Parse parses a struct tag to a `map[string][]string`.
// For non-conventional tags where the key is repeated.
func Parse(tag string) (Tag, error) {
	return parser.Tag(tag, NewFiller())
}
