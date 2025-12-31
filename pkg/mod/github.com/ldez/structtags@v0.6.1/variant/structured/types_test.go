package structured

import (
	"slices"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTag_Get(t *testing.T) {
	tag := NewTag(false, DuplicateKeysIgnore)

	element := &Entry{Key: "test", RawValue: "a"}
	tag.entries = append(tag.entries, element)

	entry := tag.Get("test")
	require.NotNil(t, entry)

	assert.Equal(t, element, entry)
}

func TestTag_Get_not_found(t *testing.T) {
	tag := NewTag(false, DuplicateKeysIgnore)

	entry := tag.Get("test")
	require.Nil(t, entry)
}

func TestTag_Add(t *testing.T) {
	tag := NewTag(false, DuplicateKeysIgnore)

	err := tag.Add(&Entry{Key: "test", RawValue: "a"})
	require.NoError(t, err)

	require.Len(t, tag.entries, 1)

	assert.Equal(t, &Entry{Key: "test", RawValue: "a"}, tag.entries[0])
}

func TestTag_Add_duplicate_error(t *testing.T) {
	tag := NewTag(false, DuplicateKeysDeny)

	a := &Entry{Key: "test", RawValue: "a"}

	err := tag.Add(a)
	require.NoError(t, err)

	b := &Entry{Key: "test", RawValue: "b"}

	err = tag.Add(b)
	require.Error(t, err)

	assert.Equal(t, []*Entry{a}, tag.entries)
}

func TestTag_Add_duplicate(t *testing.T) {
	tag := NewTag(false, DuplicateKeysAllow)

	a := &Entry{Key: "test", RawValue: "a"}

	err := tag.Add(a)
	require.NoError(t, err)

	b := &Entry{Key: "test", RawValue: "b"}

	err = tag.Add(b)
	require.NoError(t, err)

	assert.Equal(t, []*Entry{a, b}, tag.entries)
}

func TestTag_Delete(t *testing.T) {
	tag := NewTag(false, DuplicateKeysIgnore)

	tag.entries = append(tag.entries, &Entry{Key: "test", RawValue: "a"})

	tag.Delete("test")

	require.Empty(t, tag.entries)
}

func TestTag_Delete_not_found(t *testing.T) {
	tag := NewTag(false, DuplicateKeysIgnore)

	tag.entries = append(tag.entries, &Entry{Key: "test", RawValue: "a"})

	tag.Delete("nope")

	require.Len(t, tag.entries, 1)
}

func TestTag_Seq(t *testing.T) {
	tag := NewTag(false, DuplicateKeysIgnore)

	tag.entries = append(tag.entries, &Entry{Key: "test", RawValue: "a"})

	entries := slices.Collect(tag.Seq())

	assert.Equal(t, tag.entries, entries)
}

func TestTag_String(t *testing.T) {
	testCases := []struct {
		desc     string
		entries  []*Entry
		expected string
	}{
		{
			desc: "with entries",
			entries: []*Entry{
				{Key: "a", RawValue: "1"},
				{Key: "b", RawValue: "2"},
			},
			expected: `a="1" b="2"`,
		},
		{
			desc:     "empty",
			expected: "",
		},
	}

	for _, test := range testCases {
		t.Run(test.desc, func(t *testing.T) {
			t.Parallel()

			tag := NewTag(false, DuplicateKeysIgnore)
			tag.entries = test.entries

			assert.Equal(t, test.expected, tag.String())
		})
	}
}

func TestEntry_Values(t *testing.T) {
	testCases := []struct {
		desc     string
		entry    *Entry
		expected TagValues
	}{
		{
			desc:     "empty",
			entry:    &Entry{},
			expected: TagValues{""},
		},
		{
			desc:     "one value",
			entry:    &Entry{Key: "a", RawValue: "1"},
			expected: TagValues{"1"},
		},
		{
			desc:     "multiple values",
			entry:    &Entry{Key: "a", RawValue: "1,2,3,4,5"},
			expected: TagValues{"1", "2", "3", "4", "5"},
		},
		{
			desc: "escaped comma",
			entry: &Entry{
				Key:         "a",
				RawValue:    "1\\,1,2",
				escapeComma: true,
			},
			expected: TagValues{"1\\,1", "2"},
		},
	}

	for _, test := range testCases {
		t.Run(test.desc, func(t *testing.T) {
			t.Parallel()

			values, err := test.entry.Values()
			require.NoError(t, err)

			assert.Equal(t, test.expected, values)
		})
	}
}

func TestEntry_String(t *testing.T) {
	testCases := []struct {
		desc     string
		entry    *Entry
		expected string
	}{
		{
			desc:     "one value",
			entry:    &Entry{Key: "a", RawValue: "1"},
			expected: `a="1"`,
		},
		{
			desc:     "empty value",
			entry:    &Entry{Key: "a"},
			expected: `a=""`,
		},
		{
			desc:     "multiple values",
			entry:    &Entry{Key: "a", RawValue: "1,2,3,4,5"},
			expected: `a="1,2,3,4,5"`,
		},
	}

	for _, test := range testCases {
		t.Run(test.desc, func(t *testing.T) {
			t.Parallel()

			assert.Equal(t, test.expected, test.entry.String())
		})
	}
}

func TestTagValues_Has(t *testing.T) {
	testCases := []struct {
		desc   string
		values TagValues
		value  string
		assert assert.BoolAssertionFunc
	}{
		{
			desc:   "found",
			values: TagValues{"a", "b", "c"},
			value:  "a",
			assert: assert.True,
		},
		{
			desc:   "not found",
			values: TagValues{"a", "b", "c"},
			value:  "d",
			assert: assert.False,
		},
	}

	for _, test := range testCases {
		t.Run(test.desc, func(t *testing.T) {
			t.Parallel()

			test.assert(t, test.values.Has(test.value))
		})
	}
}

func TestTagValues_IsEmpty(t *testing.T) {
	testCases := []struct {
		desc   string
		values TagValues
		assert assert.BoolAssertionFunc
	}{
		{
			desc:   "empty (nil)",
			assert: assert.True,
		},
		{
			desc:   "empty",
			values: TagValues{""},
			assert: assert.True,
		},
		{
			desc:   "not empty",
			values: TagValues{"a"},
			assert: assert.False,
		},
	}

	for _, test := range testCases {
		t.Run(test.desc, func(t *testing.T) {
			t.Parallel()

			test.assert(t, test.values.IsEmpty())
		})
	}
}

func TestTagValues_String(t *testing.T) {
	testCases := []struct {
		desc     string
		values   TagValues
		expected string
	}{
		{
			desc:     "empty (nil)",
			expected: "",
		},
		{
			desc:     "empty",
			values:   TagValues{""},
			expected: "",
		},
		{
			desc:     "one value",
			values:   TagValues{"a"},
			expected: "a",
		},
		{
			desc:     "multiple values",
			values:   TagValues{"a", "b", "c"},
			expected: "a,b,c",
		},
	}

	for _, test := range testCases {
		t.Run(test.desc, func(t *testing.T) {
			t.Parallel()

			assert.Equal(t, test.expected, test.values.String())
		})
	}
}
