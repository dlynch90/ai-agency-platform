package fatih

import (
	"testing"

	"github.com/fatih/structtag"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestFiller_Fill(t *testing.T) {
	filler := NewFiller(false)

	err := filler.Fill("a", "b")
	require.NoError(t, err)

	err = filler.Fill("d", "e,f\\,g")
	require.NoError(t, err)

	expected := []*structtag.Tag{
		{Key: "a", Name: "b"},
		{
			Key:     "d",
			Name:    "e",
			Options: []string{"f\\", "g"},
		},
	}

	assert.Equal(t, expected, filler.Data())
}

func TestFiller_Fill_escapeComma(t *testing.T) {
	filler := NewFiller(true)

	err := filler.Fill("a", "b")
	require.NoError(t, err)

	err = filler.Fill("d", "e,f\\,g")
	require.NoError(t, err)

	expected := []*structtag.Tag{
		{Key: "a", Name: "b"},
		{
			Key:     "d",
			Name:    "e",
			Options: []string{"f\\,g"},
		},
	}

	assert.Equal(t, expected, filler.Data())
}

func TestFiller_Fill_duplicate(t *testing.T) {
	filler := NewFiller(false)

	err := filler.Fill("a", "b")
	require.NoError(t, err)

	err = filler.Fill("a", "c")
	require.NoError(t, err)

	expected := []*structtag.Tag{
		{Key: "a", Name: "b"},
		{Key: "a", Name: "c"},
	}

	assert.Equal(t, expected, filler.Data())
}
