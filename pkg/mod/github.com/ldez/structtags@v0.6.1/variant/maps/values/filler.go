package values

import (
	"fmt"

	"github.com/ldez/structtags/parser"
)

type Filler struct {
	data Tag

	escapeComma       bool
	duplicateKeysMode DuplicateKeysMode
}

func NewFiller(escapeComma bool, duplicateKeysMode DuplicateKeysMode) *Filler {
	return &Filler{
		escapeComma:       escapeComma,
		duplicateKeysMode: duplicateKeysMode,
	}
}

func (f *Filler) Data() Tag {
	return f.data
}

func (f *Filler) Fill(key, value string) error {
	if f.data != nil && len(f.data[key]) > 0 {
		switch f.duplicateKeysMode {
		case DuplicateKeysDeny:
			return fmt.Errorf("duplicate key %q", key)

		case DuplicateKeysAllow:
			// Do nothing.

		case DuplicateKeysIgnore:
			return nil

		default:
			return nil
		}
	}

	if f.data == nil {
		f.data = Tag{}
	}

	values, err := parser.Value(value, f.escapeComma)
	if err != nil {
		return err
	}

	f.data[key] = append(f.data[key], values...)

	return nil
}
