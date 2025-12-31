package values

import (
	"fmt"

	"github.com/ldez/structtags/parser"
)

type Filler struct {
	data Tags

	keys map[string]struct{}

	escapeComma       bool
	duplicateKeysMode DuplicateKeysMode
}

func NewFiller(escapeComma bool, duplicateKeysMode DuplicateKeysMode) *Filler {
	return &Filler{
		keys:              make(map[string]struct{}),
		escapeComma:       escapeComma,
		duplicateKeysMode: duplicateKeysMode,
	}
}

func (f *Filler) Data() Tags {
	return f.data
}

func (f *Filler) Fill(key, value string) error {
	if _, ok := f.keys[key]; ok {
		switch f.duplicateKeysMode {
		case DuplicateKeysIgnore:
			return nil

		case DuplicateKeysDeny:
			return fmt.Errorf("duplicate key %q", key)

		case DuplicateKeysAllow:
			// Do nothing.
		}
	}

	f.keys[key] = struct{}{}

	values, err := parser.Value(value, f.escapeComma)
	if err != nil {
		return err
	}

	f.data = append(f.data, Tag{
		Key:    key,
		Values: values,
	})

	return nil
}
