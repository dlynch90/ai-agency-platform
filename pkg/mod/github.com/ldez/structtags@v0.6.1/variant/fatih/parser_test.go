package fatih

import (
	"testing"

	"github.com/fatih/structtag"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParse(t *testing.T) {
	testCases := []struct {
		desc     string
		tag      string
		expected []*structtag.Tag
	}{
		{
			desc:     "no tag",
			tag:      "",
			expected: nil,
		},
		{
			desc: "empty value",
			tag:  `json:""`,
			expected: []*structtag.Tag{
				{Key: "json", Name: ""},
			},
		},
		{
			desc: "simple value",
			tag:  `json:"a"`,
			expected: []*structtag.Tag{
				{Key: "json", Name: "a"},
			},
		},
		{
			desc: "multiple values",
			tag:  `json:"a,b,c"`,
			expected: []*structtag.Tag{{
				Key:     "json",
				Name:    "a",
				Options: []string{"b", "c"},
			}},
		},
		{
			desc: "quoted value",
			tag:  `json:"a:\"b\""`,
			expected: []*structtag.Tag{
				{Key: "json", Name: "a:\"b\""},
			},
		},
		{
			desc: "escaped coma",
			tag:  `json:"b\\,c\\,d,e"`,
			expected: []*structtag.Tag{{
				Key:     "json",
				Name:    "b\\",
				Options: []string{"c\\", "d", "e"},
			}},
		},
		{
			desc: "multiple empty tag",
			tag:  `json:"" yaml:""`,
			expected: []*structtag.Tag{
				{Key: "json", Name: ""},
				{Key: "yaml", Name: ""},
			},
		},
		{
			desc: "multiple tag",
			tag:  `json:"a" yaml:"b"`,
			expected: []*structtag.Tag{
				{Key: "json", Name: "a"},
				{Key: "yaml", Name: "b"},
			},
		},
		{
			desc: "identical keys",
			tag:  `json:"a" json:"b"`,
			expected: []*structtag.Tag{
				{Key: "json", Name: "b"},
			},
		},
	}

	for _, test := range testCases {
		t.Run(test.desc, func(t *testing.T) {
			t.Parallel()

			tags, err := Parse(test.tag, false)
			require.NoError(t, err)

			if test.expected == nil {
				if !assert.Nil(t, tags) {
					assert.Equal(t, test.expected, tags.Tags())
				}
			} else {
				assert.Equal(t, test.expected, tags.Tags())
			}
		})
	}
}

func TestParse_extended(t *testing.T) {
	testCases := []struct {
		desc     string
		tag      string
		expected []*structtag.Tag
	}{
		{
			desc:     "no tag",
			tag:      "",
			expected: nil,
		},
		{
			desc: "empty value",
			tag:  `json:""`,
			expected: []*structtag.Tag{
				{Key: "json", Name: ""},
			},
		},
		{
			desc: "simple value",
			tag:  `json:"a"`,
			expected: []*structtag.Tag{
				{Key: "json", Name: "a"},
			},
		},
		{
			desc: "multiple values",
			tag:  `json:"a,b,c"`,
			expected: []*structtag.Tag{{
				Key:     "json",
				Name:    "a",
				Options: []string{"b", "c"},
			}},
		},
		{
			desc: "quoted value",
			tag:  `json:"a:\"b\""`,
			expected: []*structtag.Tag{
				{Key: "json", Name: "a:\"b\""},
			},
		},
		{
			desc: "escaped coma",
			tag:  `json:"b\\,c\\,d,e"`,
			expected: []*structtag.Tag{{
				Key:     "json",
				Name:    "b\\,c\\,d",
				Options: []string{"e"},
			}},
		},
		{
			desc: "multiple empty tag",
			tag:  `json:"" yaml:""`,
			expected: []*structtag.Tag{
				{Key: "json", Name: ""},
				{Key: "yaml", Name: ""},
			},
		},
		{
			desc: "multiple tag",
			tag:  `json:"a" yaml:"b"`,
			expected: []*structtag.Tag{
				{Key: "json", Name: "a"},
				{Key: "yaml", Name: "b"},
			},
		},
		{
			desc: "identical keys",
			tag:  `json:"a" json:"b"`,
			expected: []*structtag.Tag{
				{Key: "json", Name: "b"},
			},
		},
	}

	for _, test := range testCases {
		t.Run(test.desc, func(t *testing.T) {
			t.Parallel()

			tags, err := Parse(test.tag, true)
			require.NoError(t, err)

			if test.expected == nil {
				if !assert.Nil(t, tags) {
					assert.Equal(t, test.expected, tags.Tags())
				}
			} else {
				assert.Equal(t, test.expected, tags.Tags())
			}
		})
	}
}
