package raw

import "fmt"

type Filler struct {
	data Tags

	keys map[string]struct{}

	duplicateKeysMode DuplicateKeysMode
}

func NewFiller(duplicateKeysMode DuplicateKeysMode) *Filler {
	return &Filler{
		keys:              map[string]struct{}{},
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

	f.data = append(f.data, Tag{
		Key:   key,
		Value: value,
	})

	return nil
}
