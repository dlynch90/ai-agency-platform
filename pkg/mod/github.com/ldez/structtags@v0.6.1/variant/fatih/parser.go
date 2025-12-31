package fatih

import (
	"github.com/fatih/structtag"
	"github.com/ldez/structtags/parser"
)

// Parse parses a struct tag to a [*structtag.Tags].
// The value is split on comma.
func Parse(tag string, escapeComma bool) (*structtag.Tags, error) {
	tags, err := parser.Tag(tag, NewFiller(escapeComma))
	if err != nil {
		return nil, err
	}

	if len(tags) == 0 {
		return nil, nil
	}

	ftgs := &structtag.Tags{}

	for _, s := range tags {
		if err := ftgs.Set(s); err != nil {
			return nil, err
		}
	}

	return ftgs, err
}
