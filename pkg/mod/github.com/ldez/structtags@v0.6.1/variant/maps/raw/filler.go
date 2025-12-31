package raw

import "fmt"

type Filler struct {
	data Tag

	duplicateKeysMode DuplicateKeysMode
}

func NewFiller(duplicateKeysMode DuplicateKeysMode) *Filler {
	return &Filler{duplicateKeysMode: duplicateKeysMode}
}

func (f *Filler) Data() Tag {
	return f.data
}

func (f *Filler) Fill(key, value string) error {
	if f.data != nil && f.data[key] != "" {
		switch f.duplicateKeysMode {
		case DuplicateKeysDeny:
			return fmt.Errorf("duplicate key %q", key)

		default:
			return nil
		}
	}

	if f.data == nil {
		f.data = Tag{}
	}

	f.data[key] = value

	return nil
}
