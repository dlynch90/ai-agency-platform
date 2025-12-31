package values

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParse(t *testing.T) {
	testCases := []struct {
		desc     string
		tag      string
		expected Tags
	}{
		{
			desc:     "no tag",
			tag:      "",
			expected: nil,
		},
		{
			desc:     "empty value",
			tag:      `json:""`,
			expected: Tags{{Key: "json", Values: []string{""}}},
		},
		{
			desc:     "simple value",
			tag:      `json:"a"`,
			expected: Tags{{Key: "json", Values: []string{"a"}}},
		},
		{
			desc:     "multiple values",
			tag:      `json:"a,b,c"`,
			expected: Tags{{Key: "json", Values: []string{"a", "b", "c"}}},
		},
		{
			desc:     "quoted value",
			tag:      `json:"a:\"b\""`,
			expected: Tags{{Key: "json", Values: []string{"a:\"b\""}}},
		},
		{
			desc:     "escaped coma",
			tag:      `json:"b\\,c\\,d,e"`,
			expected: Tags{{Key: "json", Values: []string{"b\\,c\\,d", "e"}}},
		},
		{
			desc: "multiple empty tag",
			tag:  `json:"" yaml:""`,
			expected: Tags{
				{Key: "json", Values: []string{""}},
				{Key: "yaml", Values: []string{""}},
			},
		},
		{
			desc: "multiple tag",
			tag:  `json:"a" yaml:"b"`,
			expected: Tags{
				{Key: "json", Values: []string{"a"}},
				{Key: "yaml", Values: []string{"b"}},
			},
		},
		{
			desc: "identical keys",
			tag:  `json:"a" json:"b"`,
			expected: Tags{
				{Key: "json", Values: []string{"a"}},
			},
		},
	}

	for _, test := range testCases {
		t.Run(test.desc, func(t *testing.T) {
			t.Parallel()

			tags, err := Parse(test.tag, WithEscapeComma())
			require.NoError(t, err)

			assert.Equal(t, test.expected, tags)
		})
	}
}

func TestParse_options(t *testing.T) {
	_, err := Parse(`a:"1" a:"2"`, WithDuplicateKeysMode(DuplicateKeysDeny))
	require.EqualError(t, err, `duplicate key "a"`)
}
