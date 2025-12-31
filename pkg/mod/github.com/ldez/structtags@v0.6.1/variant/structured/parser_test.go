package structured

import (
	"slices"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParse(t *testing.T) {
	testCases := []struct {
		desc     string
		tag      string
		options  []Option
		expected []*Entry
	}{
		{
			desc:     "no tag",
			tag:      "",
			expected: nil,
		},
		{
			desc: "empty value",
			tag:  `json:""`,
			expected: []*Entry{
				{Key: "json", RawValue: ""},
			},
		},
		{
			desc: "simple value",
			tag:  `json:"a"`,
			expected: []*Entry{
				{Key: "json", RawValue: "a"},
			},
		},
		{
			desc: "multiple values",
			tag:  `json:"a,b,c"`,

			expected: []*Entry{
				{Key: "json", RawValue: "a,b,c"},
			},
		},
		{
			desc: "quoted value",
			tag:  `json:"a:\"b\""`,
			expected: []*Entry{
				{Key: "json", RawValue: "a:\"b\""},
			},
		},
		{
			desc: "ignore escaped coma",
			tag:  `json:"b\\,c\\,d,e"`,
			expected: []*Entry{
				{Key: "json", RawValue: "b\\,c\\,d,e"},
			},
		},
		{
			desc: "multiple empty tag",
			tag:  `json:"" yaml:""`,
			expected: []*Entry{
				{Key: "json", RawValue: ""},
				{Key: "yaml", RawValue: ""},
			},
		},
		{
			desc: "multiple tag",
			tag:  `json:"a" yaml:"b"`,
			expected: []*Entry{
				{Key: "json", RawValue: "a"},
				{Key: "yaml", RawValue: "b"},
			},
		},
		{
			desc:    "identical keys",
			tag:     `json:"a" json:"b"`,
			options: []Option{WithDuplicateKeysMode(DuplicateKeysAllow)},
			expected: []*Entry{
				{Key: "json", RawValue: "a"},
				{Key: "json", RawValue: "b"},
			},
		},
	}

	for _, test := range testCases {
		t.Run(test.desc, func(t *testing.T) {
			t.Parallel()

			tags, err := Parse(test.tag, test.options...)
			require.NoError(t, err)

			if test.expected == nil {
				if !assert.True(t, tags.IsEmpty()) {
					assert.Equal(t, test.expected, slices.Collect(tags.Seq()))
				}
			} else {
				assert.Equal(t, test.expected, slices.Collect(tags.Seq()))
			}
		})
	}
}

func TestParse_options(t *testing.T) {
	tags, err := Parse(`a:"1\\,2"`, WithEscapeComma())
	require.NoError(t, err)

	expected := []*Entry{
		{
			Key:         "a",
			RawValue:    "1\\,2",
			escapeComma: true,
		},
	}

	assert.Equal(t, expected, slices.Collect(tags.Seq()))
}
