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
		expected Tag
	}{
		{
			desc:     "no tag",
			tag:      "",
			expected: nil,
		},
		{
			desc:     "empty value",
			tag:      `json:""`,
			expected: Tag{"json": ""},
		},
		{
			desc:     "simple value",
			tag:      `json:"a"`,
			expected: Tag{"json": "a"},
		},
		{
			desc:     "multiple values",
			tag:      `json:"a,b,c"`,
			expected: Tag{"json": "a,b,c"},
		},
		{
			desc:     "quoted value",
			tag:      `json:"a:\"b\""`,
			expected: Tag{"json": "a:\"b\""},
		},
		{
			desc: "multiple empty tag",
			tag:  `json:"" yaml:""`,
			expected: Tag{
				"json": "",
				"yaml": "",
			},
		},
		{
			desc: "multiple tag",
			tag:  `json:"a" yaml:"b"`,
			expected: Tag{
				"json": "a",
				"yaml": "b",
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
