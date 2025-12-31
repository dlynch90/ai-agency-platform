package multikeys

type Filler struct {
	data Tag
}

func NewFiller() *Filler {
	return &Filler{}
}

func (f *Filler) Data() Tag {
	return f.data
}

func (f *Filler) Fill(key, value string) error {
	if f.data == nil {
		f.data = Tag{}
	}

	f.data[key] = append(f.data[key], value)

	return nil
}
