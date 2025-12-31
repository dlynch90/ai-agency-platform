package values

import (
	"fmt"
	"maps"
	"slices"
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

// Tag is a key/values map.
type Tag map[string][]string

func (m Tag) String() string {
	var b strings.Builder

	keys := slices.AppendSeq(make([]string, 0, len(m)), maps.Keys(m))

	slices.Sort(keys)

	for _, k := range keys {
		b.WriteString(fmt.Sprintf("%s:%q ", k, strings.Join(m[k], ",")))
	}

	return strings.TrimSuffix(b.String(), " ")
}
