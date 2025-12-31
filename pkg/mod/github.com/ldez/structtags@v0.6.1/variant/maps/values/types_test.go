package values

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestTag_String(t *testing.T) {
	testCases := []struct {
		desc     string
		tag      Tag
		expected string
	}{
		{
			desc:     "empty",
			expected: "",
		},
		{
			desc:     "one entry",
			tag:      Tag{"a": []string{"b"}},
			expected: `a:"b"`,
		},
		{
			desc: "multiple entries",
			tag: Tag{
				"a": []string{"b"},
				"c": []string{"d", "e"},
			},
			expected: `a:"b" c:"d,e"`,
		},
	}

	for _, test := range testCases {
		t.Run(test.desc, func(t *testing.T) {
			t.Parallel()

			assert.Equal(t, test.expected, test.tag.String())
		})
	}
}
