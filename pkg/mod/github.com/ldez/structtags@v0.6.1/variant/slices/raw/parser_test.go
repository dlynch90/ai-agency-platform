package raw

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
			expected: Tags{{Key: "json", Value: ""}},
		},
		{
			desc:     "simple value",
			tag:      `json:"a"`,
			expected: Tags{{Key: "json", Value: "a"}},
		},
		{
			desc:     "multiple values",
			tag:      `json:"a,b,c"`,
			expected: Tags{{Key: "json", Value: "a,b,c"}},
		},
		{
			desc:     "quoted value",
			tag:      `json:"a:\"b\""`,
			expected: Tags{{Key: "json", Value: "a:\"b\""}},
		},
		{
			desc: "multiple empty tag",
			tag:  `json:"" yaml:""`,
			expected: Tags{
				{Key: "json", Value: ""},
				{Key: "yaml", Value: ""},
			},
		},
		{
			desc: "multiple tag",
			tag:  `json:"a" yaml:"b"`,
			expected: Tags{
				{Key: "json", Value: "a"},
				{Key: "yaml", Value: "b"},
			},
		},
		{
			desc: "identical keys",
			tag:  `json:"a" json:"b"`,
			expected: Tags{
				{Key: "json", Value: "a"},
			},
		},
	}

	for _, test := range testCases {
		t.Run(test.desc, func(t *testing.T) {
			t.Parallel()

			tags, err := Parse(test.tag)
			require.NoError(t, err)

			assert.Equal(t, test.expected, tags)
		})
	}
}

func TestParse_options(t *testing.T) {
	_, err := Parse(`a:"1" a:"2"`, WithDuplicateKeysMode(DuplicateKeysDeny))
	require.EqualError(t, err, `duplicate key "a"`)
}
