package structured

// Filler fills the tag from a struct tag.
type Filler struct {
	data *Tag

	escapeComma       bool
	duplicateKeysMode DuplicateKeysMode
}

// NewFiller creates a new [Filler].
func NewFiller(escapeComma bool, duplicateKeysMode DuplicateKeysMode) *Filler {
	return &Filler{
		escapeComma:       escapeComma,
		duplicateKeysMode: duplicateKeysMode,
	}
}

// Data returns the [Tag] filled by the struct tag content.
func (f *Filler) Data() *Tag {
	return f.data
}

// Fill fills the data from a struct tag.
func (f *Filler) Fill(key, value string) error {
	if f.data == nil {
		f.data = NewTag(f.escapeComma, f.duplicateKeysMode)
	}

	return f.data.Add(&Entry{Key: key, RawValue: value})
}
