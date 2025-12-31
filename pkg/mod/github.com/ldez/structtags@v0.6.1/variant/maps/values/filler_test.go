package values

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestFiller_Fill(t *testing.T) {
	filler := NewFiller(true, DuplicateKeysIgnore)

	err := filler.Fill("a", "b")
	require.NoError(t, err)

	err = filler.Fill("d", "e,f\\,g")
	require.NoError(t, err)

	expected := Tag{
		"a": {"b"},
		"d": {"e", "f\\,g"},
	}

	assert.Equal(t, expected, filler.Data())
}

func TestFiller_Fill_noescape(t *testing.T) {
	filler := NewFiller(false, DuplicateKeysIgnore)

	err := filler.Fill("a", "b")
	require.NoError(t, err)

	err = filler.Fill("d", "e,f\\,g")
	require.NoError(t, err)

	expected := Tag{
		"a": {"b"},
		"d": {"e", "f\\", "g"},
	}

	assert.Equal(t, expected, filler.Data())
}

func TestFiller_Fill_duplicate_ignore(t *testing.T) {
	filler := NewFiller(true, DuplicateKeysIgnore)

	err := filler.Fill("a", "b")
	require.NoError(t, err)

	err = filler.Fill("a", "c")
	require.NoError(t, err)

	expected := Tag{
		"a": {"b"},
	}

	assert.Equal(t, expected, filler.Data())
}

func TestFiller_Fill_duplicate_deny(t *testing.T) {
	filler := NewFiller(true, DuplicateKeysDeny)

	err := filler.Fill("a", "b")
	require.NoError(t, err)

	err = filler.Fill("a", "c")
	require.EqualError(t, err, `duplicate key "a"`)
}

func TestFiller_Fill_duplicate_allow(t *testing.T) {
	filler := NewFiller(true, DuplicateKeysAllow)

	err := filler.Fill("a", "b")
	require.NoError(t, err)

	err = filler.Fill("a", "c")
	require.NoError(t, err)

	expected := Tag{
		"a": {"b", "c"},
	}

	assert.Equal(t, expected, filler.Data())
}
