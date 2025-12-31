package parser

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseValue(t *testing.T) {
	testCases := []struct {
		desc               string
		raw                string
		expected           []string
		expectedNotEscaped []string
	}{
		{
			desc:     "no values",
			expected: []string{""},
		},
		{
			desc:     "single value",
			raw:      "a",
			expected: []string{"a"},
		},
		{
			desc:     "start with comma",
			raw:      ",a",
			expected: []string{"", "a"},
		},
		{
			desc:     "end with comma",
			raw:      "a,",
			expected: []string{"a", ""},
		},
		{
			desc:     "multiple commas",
			raw:      "a,,,b",
			expected: []string{"a", "", "", "b"},
		},
		{
			desc:     "multiple commas, end with comma",
			raw:      "a,,,",
			expected: []string{"a", "", "", ""},
		},
		{
			desc:     "only commas",
			raw:      ",,,",
			expected: []string{"", "", "", ""},
		},
		{
			desc:     "only one comma",
			raw:      ",",
			expected: []string{"", ""},
		},
		{
			desc:     "literal tab",
			raw:      `literal	tab`,
			expected: []string{"literal\ttab"},
		},
		{
			desc:     "escaped tab",
			raw:      "literal\ttab",
			expected: []string{"literal\ttab"},
		},
		{
			desc:     "multiple values",
			raw:      "a,b,c",
			expected: []string{"a", "b", "c"},
		},
		{
			desc:               "escaped comma",
			raw:                "a,b\\,b,c",
			expected:           []string{"a", "b\\,b", "c"},
			expectedNotEscaped: []string{"a", "b\\", "b", "c"},
		},
		{
			desc:               "escaped comma (literal)",
			raw:                `a,b\,b,c`,
			expected:           []string{"a", "b\\,b", "c"},
			expectedNotEscaped: []string{"a", "b\\", "b", "c"},
		},
		{
			desc:               "multiple escaped comma",
			raw:                `a,b\,b\,b,c`,
			expected:           []string{"a", "b\\,b\\,b", "c"},
			expectedNotEscaped: []string{"a", "b\\", "b\\", "b", "c"},
		},
		{
			desc:     "escape is not related to comma",
			raw:      `a,b\\,c,d`,
			expected: []string{"a", "b\\\\", "c", "d"},
		},
	}

	for _, test := range testCases {
		t.Run(test.desc, func(t *testing.T) {
			t.Parallel()

			values, err := Value(test.raw, true)
			require.NoError(t, err)

			assert.Equal(t, test.expected, values)

			expectedNotEscaped := test.expectedNotEscaped
			if expectedNotEscaped == nil {
				expectedNotEscaped = test.expected
			}

			values, err = Value(test.raw, false)
			require.NoError(t, err)

			assert.Equal(t, expectedNotEscaped, values)
		})
	}
}
