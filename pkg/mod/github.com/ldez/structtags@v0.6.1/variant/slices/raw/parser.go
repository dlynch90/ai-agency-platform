package raw

import "github.com/ldez/structtags/parser"

// Parse parses a struct tag to a slice of [Tag].
// Ignore duplicated keys by default.
func Parse(tag string, options ...Option) (Tags, error) {
	var cfg config

	for _, opt := range options {
		opt(&cfg)
	}

	return parser.Tag(tag, NewFiller(cfg.DuplicateKeysMode))
}
