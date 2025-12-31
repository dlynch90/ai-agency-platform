package parser

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type TestTag struct {
	Key   string
	Value string
}

type TestFiller struct {
	data []TestTag
}

func (f *TestFiller) Data() []TestTag {
	return f.data
}

func (f *TestFiller) Fill(key, value string) error {
	if key == "oops" {
		return errors.New("oops")
	}

	f.data = append(f.data, TestTag{
		Key:   key,
		Value: value,
	})

	return nil
}

func TestParseTag(t *testing.T) {
	testCases := []struct {
		desc     string
		tag      string
		expected []TestTag
	}{
		{
			desc:     "no tag",
			tag:      "",
			expected: nil,
		},
		{
			desc:     "empty value",
			tag:      `json:""`,
			expected: []TestTag{{Key: "json", Value: ""}},
		},
		{
			desc:     "whitespace value",
			tag:      ` `,
			expected: nil,
		},
		{
			desc:     "ignore whitespace before the key",
			tag:      `   json:"a"`,
			expected: []TestTag{{Key: "json", Value: "a"}},
		},
		{
			desc:     "ignore whitespace after the value",
			tag:      `json:"a"   `,
			expected: []TestTag{{Key: "json", Value: "a"}},
		},
		{
			desc:     "simple value",
			tag:      `json:"a"`,
			expected: []TestTag{{Key: "json", Value: "a"}},
		},
		{
			desc:     "simple value (double quotes)",
			tag:      "json:\"a\"",
			expected: []TestTag{{Key: "json", Value: "a"}},
		},
		{
			desc:     "multiple values",
			tag:      `json:"a,b,c"`,
			expected: []TestTag{{Key: "json", Value: "a,b,c"}},
		},
		{
			desc:     "quoted value",
			tag:      `json:"a:\"b\""`,
			expected: []TestTag{{Key: "json", Value: "a:\"b\""}},
		},
		{
			desc: "multiple empty tag",
			tag:  `json:"" yaml:""`,
			expected: []TestTag{
				{Key: "json", Value: ""},
				{Key: "yaml", Value: ""},
			},
		},
		{
			desc: "multiple tag",
			tag:  `json:"a" yaml:"b"`,
			expected: []TestTag{
				{Key: "json", Value: "a"},
				{Key: "yaml", Value: "b"},
			},
		},
		{
			desc: "identical tag",
			tag:  `json:"a" json:"b"`,
			expected: []TestTag{
				{Key: "json", Value: "a"},
				{Key: "json", Value: "b"},
			},
		},
	}

	for _, test := range testCases {
		t.Run(test.desc, func(t *testing.T) {
			t.Parallel()

			tags, err := Tag(test.tag, &TestFiller{})
			require.NoError(t, err)

			assert.Equal(t, test.expected, tags)
		})
	}
}

func TestParseTag_error(t *testing.T) {
	testCases := []struct {
		desc     string
		tag      string
		expected string
	}{
		{
			desc:     "missing colon",
			tag:      `json`,
			expected: "invalid struct tag syntax `json`: missing `:`",
		},
		{
			desc:     "no value",
			tag:      `json:`,
			expected: "invalid struct tag value `json:`",
		},
		{
			desc:     "missing quotes",
			tag:      `json:q`,
			expected: "invalid struct tag value `json:q`: missing opening quote",
		},
		{
			desc:     "missing opening quote",
			tag:      `json:q"`,
			expected: "invalid struct tag value `json:q\"`: missing opening quote",
		},
		{
			desc:     "missing closing quote without value",
			tag:      `json:"`,
			expected: "invalid struct tag value `json:\"`: missing closing quote",
		},
		{
			desc:     "missing closing quote",
			tag:      `json:"a`,
			expected: "invalid struct tag value `json:\"a`: missing closing quote",
		},
		{
			desc:     "too many quotes (end)",
			tag:      `json:"a""`,
			expected: "invalid struct tag syntax `json:\"a\"\"`",
		},
		{
			desc:     "too many quotes (start)",
			tag:      `json:""a"`,
			expected: "invalid struct tag value `json:\"\"a\"`",
		},
		{
			desc:     "space after the key",
			tag:      `json:  `,
			expected: "invalid struct tag value `json:  `: missing opening quote",
		},
		{
			desc:     "space",
			tag:      `json:"   `,
			expected: "invalid struct tag value `json:\"   `: missing closing quote",
		},
		{
			desc:     "tab",
			tag:      `json:"a"	yaml:"b"`,
			expected: "invalid struct tag syntax `json:\"a\"\tyaml:\"b\"`",
		},
		{
			desc:     "filler error",
			tag:      `oops:""`,
			expected: "oops",
		},
	}

	for _, test := range testCases {
		t.Run(test.desc, func(t *testing.T) {
			t.Parallel()

			_, err := Tag(test.tag, &TestFiller{})
			require.Error(t, err)

			assert.EqualError(t, err, test.expected)
		})
	}
}
