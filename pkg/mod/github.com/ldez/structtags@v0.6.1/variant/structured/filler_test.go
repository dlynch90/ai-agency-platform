package structured

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type tuple struct {
	key, value string
}

func TestFiller_Fill(t *testing.T) {
	testCases := []struct {
		desc              string
		data              []tuple
		escapeComma       bool
		duplicateKeysMode DuplicateKeysMode
		expected          *Tag
	}{
		{
			desc: "option: no escape, no duplicate",
			data: []tuple{
				{key: "a", value: "b"},
				{key: "d", value: "e"},
			},
			escapeComma:       false,
			duplicateKeysMode: DuplicateKeysDeny,
			expected: &Tag{
				entries: []*Entry{
					{
						Key:         "a",
						RawValue:    "b",
						escapeComma: false,
					},
					{
						Key:         "d",
						RawValue:    "e",
						escapeComma: false,
					},
				},
				escapeComma:       false,
				duplicateKeysMode: DuplicateKeysDeny,
			},
		},
		{
			desc: "option: escape, no duplicate",
			data: []tuple{
				{key: "a", value: "b"},
				{key: "d", value: "e"},
			},
			escapeComma:       true,
			duplicateKeysMode: DuplicateKeysDeny,
			expected: &Tag{
				entries: []*Entry{
					{
						Key:         "a",
						RawValue:    "b",
						escapeComma: true,
					},
					{
						Key:         "d",
						RawValue:    "e",
						escapeComma: true,
					},
				},
				escapeComma:       true,
				duplicateKeysMode: DuplicateKeysDeny,
			},
		},
		{
			desc: "option: no escape, duplicate",
			data: []tuple{
				{key: "a", value: "b"},
				{key: "d", value: "e"},
			},
			escapeComma:       false,
			duplicateKeysMode: DuplicateKeysAllow,
			expected: &Tag{
				entries: []*Entry{
					{
						Key:         "a",
						RawValue:    "b",
						escapeComma: false,
					},
					{
						Key:         "d",
						RawValue:    "e",
						escapeComma: false,
					},
				},
				escapeComma:       false,
				duplicateKeysMode: DuplicateKeysAllow,
			},
		},
		{
			desc: "option: escape, duplicate",
			data: []tuple{
				{key: "a", value: "b"},
				{key: "d", value: "e"},
			},
			escapeComma:       true,
			duplicateKeysMode: DuplicateKeysAllow,
			expected: &Tag{
				entries: []*Entry{
					{
						Key:         "a",
						RawValue:    "b",
						escapeComma: true,
					},
					{
						Key:         "d",
						RawValue:    "e",
						escapeComma: true,
					},
				},
				escapeComma:       true,
				duplicateKeysMode: DuplicateKeysAllow,
			},
		},
	}

	for _, test := range testCases {
		t.Run(test.desc, func(t *testing.T) {
			t.Parallel()

			filler := NewFiller(test.escapeComma, test.duplicateKeysMode)

			for _, d := range test.data {
				require.NoError(t, filler.Fill(d.key, d.value))
			}

			assert.Equal(t, test.expected, filler.Data())
		})
	}
}

func TestFiller_Fill_duplicate_ignore(t *testing.T) {
	filler := NewFiller(false, DuplicateKeysIgnore)

	err := filler.Fill("a", "b")
	require.NoError(t, err)

	err = filler.Fill("a", "c")
	require.NoError(t, err)

	expected := &Tag{
		entries: []*Entry{
			{Key: "a", RawValue: "b"},
		},
		escapeComma:       false,
		duplicateKeysMode: DuplicateKeysIgnore,
	}

	assert.Equal(t, expected, filler.Data())
}

func TestFiller_Fill_duplicate_deny(t *testing.T) {
	filler := NewFiller(false, DuplicateKeysDeny)

	err := filler.Fill("a", "b")
	require.NoError(t, err)

	err = filler.Fill("a", "c")
	require.Error(t, err)
}

func TestFiller_Fill_duplicate_allow(t *testing.T) {
	filler := NewFiller(false, DuplicateKeysAllow)

	err := filler.Fill("a", "b")
	require.NoError(t, err)

	err = filler.Fill("a", "c")
	require.NoError(t, err)

	expected := &Tag{
		entries: []*Entry{
			{Key: "a", RawValue: "b"},
			{Key: "a", RawValue: "c"},
		},
		escapeComma:       false,
		duplicateKeysMode: DuplicateKeysAllow,
	}

	assert.Equal(t, expected, filler.Data())
}
