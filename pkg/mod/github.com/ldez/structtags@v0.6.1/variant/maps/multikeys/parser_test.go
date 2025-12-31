package multikeys

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
			expected: Tag{"json": {""}},
		},
		{
			desc:     "simple value",
			tag:      `json:"a"`,
			expected: Tag{"json": {"a"}},
		},
		{
			desc:     "multiple values",
			tag:      `json:"a,b,c"`,
			expected: Tag{"json": {"a,b,c"}},
		},
		{
			desc:     "quoted value",
			tag:      `json:"a:\"b\""`,
			expected: Tag{"json": {"a:\"b\""}},
		},
		{
			desc:     "multiple empty tag",
			tag:      `json:"" yaml:""`,
			expected: Tag{"json": {""}, "yaml": {""}},
		},
		{
			desc:     "multiple tag",
			tag:      `json:"a" yaml:"b"`,
			expected: Tag{"json": {"a"}, "yaml": {"b"}},
		},
		{
			desc:     "identical keys",
			tag:      `json:"a" json:"b"`,
			expected: Tag{"json": {"a", "b"}},
		},
		{
			desc: "foo",
			tag:  `long:"thresholds" default:"1" default:"2" env:"THRESHOLD_VALUES"  env-delim:","`,
			expected: Tag{
				"default":   {"1", "2"},
				"env":       {"THRESHOLD_VALUES"},
				"env-delim": {","},
				"long":      {"thresholds"},
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
