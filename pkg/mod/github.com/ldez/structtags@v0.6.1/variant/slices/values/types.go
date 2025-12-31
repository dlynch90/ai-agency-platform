package values

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
	// EscapeComma is used to escape the comma character within the value.
	EscapeComma bool

	// DuplicateKeysMode allows duplicate keys.
	DuplicateKeysMode DuplicateKeysMode
}

type Option func(*config)

func WithEscapeComma() Option {
	return func(options *config) {
		options.EscapeComma = true
	}
}

func WithDuplicateKeysMode(mode DuplicateKeysMode) Option {
	return func(opts *config) {
		opts.DuplicateKeysMode = mode
	}
}

type Tags []Tag

func (t Tags) String() string {
	var b strings.Builder

	for _, e := range t {
		b.WriteString(fmt.Sprintf("%s:%q ", e.Key, strings.Join(e.Values, ",")))
	}

	return strings.TrimSuffix(b.String(), " ")
}

type Tag struct {
	Key    string
	Values []string
}
