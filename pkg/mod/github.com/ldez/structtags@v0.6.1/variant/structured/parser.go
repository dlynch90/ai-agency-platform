package structured

import "github.com/ldez/structtags/parser"

// Parse parses a struct tag to a [Tag].
// Allows modifying the struct tags.
// The value is split on comma.
// Ignore duplicated keys by default.
func Parse(tag string, options ...Option) (*Tag, error) {
	var cfg config

	for _, opt := range options {
		opt(&cfg)
	}

	if tag == "" {
		return NewTag(cfg.EscapeComma, cfg.DuplicateKeysMode), nil
	}

	return parser.Tag(tag, NewFiller(cfg.EscapeComma, cfg.DuplicateKeysMode))
}
