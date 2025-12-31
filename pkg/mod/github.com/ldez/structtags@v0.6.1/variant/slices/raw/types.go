package raw

import (
	"fmt"
	"strings"
)

type DuplicateKeysMode int

const (
	// DuplicateKeysIgnore skips silently duplicate keys.
	DuplicateKeysIgnore DuplicateKeysMode = iota

	// DuplicateKeysDeny throws an error when duplicate keys are found.
	DuplicateKeysDeny

	// DuplicateKeysAllow NOT RECOMMENDED: this does not follow the struct tag conventions.
	DuplicateKeysAllow
)

// config for the parser.
type config struct {
	// DuplicateKeysMode allows duplicate keys.
	DuplicateKeysMode DuplicateKeysMode
}

type Option func(*config)

func WithDuplicateKeysMode(mode DuplicateKeysMode) Option {
	return func(opts *config) {
		opts.DuplicateKeysMode = mode
	}
}

type Tags []Tag

func (t Tags) String() string {
	var b strings.Builder

	for _, e := range t {
		b.WriteString(fmt.Sprintf("%s:%q ", e.Key, e.Value))
	}

	return strings.TrimSuffix(b.String(), " ")
}

type Tag struct {
	Key   string
	Value string
}
