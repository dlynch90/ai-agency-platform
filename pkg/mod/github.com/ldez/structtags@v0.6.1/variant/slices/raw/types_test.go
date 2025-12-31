package raw

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestTags_String(t *testing.T) {
	testCases := []struct {
		desc     string
		tag      Tags
		expected string
	}{
		{
			desc:     "empty",
			expected: "",
		},
		{
			desc:     "one entry",
			tag:      Tags{{Key: "a", Value: "b"}},
			expected: `a:"b"`,
		},
		{
			desc: "multiple entries",
			tag: Tags{
				{Key: "a", Value: "b"},
				{Key: "c", Value: "d,e"},
			},
			expected: `a:"b" c:"d,e"`,
		},
		{
			desc: "duplicate entry",
			tag: Tags{
				{Key: "a", Value: "b"},
				{Key: "a", Value: "d,e"},
			},
			expected: `a:"b" a:"d,e"`,
		},
	}

	for _, test := range testCases {
		t.Run(test.desc, func(t *testing.T) {
			t.Parallel()

			assert.Equal(t, test.expected, test.tag.String())
		})
	}
}
