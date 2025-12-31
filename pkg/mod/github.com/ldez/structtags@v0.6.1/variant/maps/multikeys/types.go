package multikeys

import (
	"fmt"
	"maps"
	"slices"
	"strings"
)

// Tag is a key/values map.
type Tag map[string][]string

func (m Tag) String() string {
	var b strings.Builder

	keys := slices.AppendSeq(make([]string, 0, len(m)), maps.Keys(m))

	slices.Sort(keys)

	for _, k := range keys {
		for _, v := range m[k] {
			b.WriteString(fmt.Sprintf("%s:%q ", k, v))
		}
	}

	return strings.TrimSuffix(b.String(), " ")
}
