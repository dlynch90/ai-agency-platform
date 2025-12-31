package structtags_test

import (
	"fmt"
	"reflect"

	"github.com/ldez/structtags"
	mapsvalues "github.com/ldez/structtags/variant/maps/values"
	slicevalues "github.com/ldez/structtags/variant/slices/values"
	"github.com/ldez/structtags/variant/structured"
)

func ExampleParseToMap() {
	type MyStruct struct {
		Field string `a:"1,2" b:"hello"`
	}

	// Gets the raw tag from the struct field.
	rawTag := reflect.TypeOf(MyStruct{}).Field(0).Tag

	data, err := structtags.ParseToMap(string(rawTag))
	if err != nil {
		panic(err)
	}

	// cast to map only to have a deterministic output for the example.
	fmt.Println(map[string]string(data))

	// Output:
	// map[a:1,2 b:hello]
}

func ExampleParseToMapMultikeys() {
	type MyStruct struct {
		Field string `a:"1,2" b:"hello" b:"world"`
	}

	// Gets the raw tag from the struct field.
	rawTag := reflect.TypeOf(MyStruct{}).Field(0).Tag

	data, err := structtags.ParseToMapMultikeys(string(rawTag))
	if err != nil {
		panic(err)
	}

	// cast to map only to have a deterministic output for the example.
	fmt.Println(map[string][]string(data))

	// Output:
	// map[a:[1,2] b:[hello world]]
}

func ExampleParseToMapValues() {
	type MyStruct struct {
		Field string `a:"1,2" b:"hello\\,world"`
	}

	// Gets the raw tag from the struct field.
	rawTag := reflect.TypeOf(MyStruct{}).Field(0).Tag

	data, err := structtags.ParseToMapValues(string(rawTag))
	if err != nil {
		panic(err)
	}

	// Cast to map only to display the raw map as output for the example.
	fmt.Println(map[string][]string(data))

	// Output:
	// map[a:[1 2] b:[hello\ world]]
}

func ExampleParseToMapValues_escaped_comma() {
	type MyStruct struct {
		Field string `a:"1,2" b:"hello\\,world"`
	}

	// Gets the raw tag from the struct field.
	rawTag := reflect.TypeOf(MyStruct{}).Field(0).Tag

	data, err := structtags.ParseToMapValues(string(rawTag), mapsvalues.WithEscapeComma())
	if err != nil {
		panic(err)
	}

	// Cast to map only to display the raw map as output for the example.
	fmt.Println(map[string][]string(data))

	// Output:
	// map[a:[1 2] b:[hello\,world]]
}

func ExampleParseToSlice() {
	type MyStruct struct {
		Field string `a:"1,2" b:"hello"`
	}

	// Gets the raw tag from the struct field.
	rawTag := reflect.TypeOf(MyStruct{}).Field(0).Tag

	data, err := structtags.ParseToSlice(string(rawTag))
	if err != nil {
		panic(err)
	}

	for _, datum := range data {
		fmt.Println(datum)
	}

	// Output:
	// {a 1,2}
	// {b hello}
}

func ExampleParseToSliceValues() {
	type MyStruct struct {
		Field string `a:"1,2" b:"hello\\,world"`
	}

	// Gets the raw tag from the struct field.
	rawTag := reflect.TypeOf(MyStruct{}).Field(0).Tag

	data, err := structtags.ParseToSliceValues(string(rawTag))
	if err != nil {
		panic(err)
	}

	for _, datum := range data {
		fmt.Println(datum)
	}

	// Output:
	// {a [1 2]}
	// {b [hello\ world]}
}

func ExampleParseToSliceValues_escaped_comma() {
	type MyStruct struct {
		Field string `a:"1,2" b:"hello\\,world"`
	}

	// Gets the raw tag from the struct field.
	rawTag := reflect.TypeOf(MyStruct{}).Field(0).Tag

	data, err := structtags.ParseToSliceValues(string(rawTag), slicevalues.WithEscapeComma())
	if err != nil {
		panic(err)
	}

	for _, datum := range data {
		fmt.Println(datum)
	}

	// Output:
	// {a [1 2]}
	// {b [hello\,world]}
}

func ExampleParseToStructured() {
	type MyStruct struct {
		Field string `b:"hello" a:"1,2" c:"world"`
	}

	// Gets the raw tag from the struct field.
	rawTag := reflect.TypeOf(MyStruct{}).Field(0).Tag

	tag, err := structtags.ParseToStructured(string(rawTag))
	if err != nil {
		panic(err)
	}

	// Iterates over all entries from the struct tag.
	for entry := range tag.Seq() {
		fmt.Printf("entry: %s\n", entry)
	}

	// get a single tag
	entryA := tag.Get("a")
	if entryA == nil {
		panic("no entry with key a")
	}

	fmt.Println("key `a`, entry:", entryA)
	fmt.Println("key `a`, entry key:", entryA.Key)
	fmt.Println("key `a`, entry value:", entryA.RawValue)

	// change existing tag
	values, err := entryA.Values()
	if err != nil {
		panic(err)
	}

	values = append(values, "test")

	entryA.RawValue = values.String()

	// Adds a new entry to the struct tag.
	err = tag.Add(&structured.Entry{
		Key:      "e",
		RawValue: "foo,bar",
	})
	if err != nil {
		panic(err)
	}

	fmt.Println("tag:", tag)

	// Sorts the entries.
	tag.Sort()

	fmt.Println("sorted tag:", tag)

	// Output:
	// entry: b="hello"
	// entry: a="1,2"
	// entry: c="world"
	// key `a`, entry: a="1,2"
	// key `a`, entry key: a
	// key `a`, entry value: 1,2
	// tag: b="hello" a="1,2,test" c="world" e="foo,bar"
	// sorted tag: a="1,2,test" b="hello" c="world" e="foo,bar"
}
