.PHONY: fmt tidy lint test bench install

default: fmt tidy lint test install

fmt:
	go fmt ./...

tidy:
	go mod tidy

lint:
	golangci-lint run --fix -v -c .golangci.yaml ./...

test:
	go test -race ./...

bench:
	# each benchmark runs for 5 seconds, in a single CPU (to make results more consistent); report memory allocation
	go test -bench=Bench ./... -benchtime 5s -cpu 1 -benchmem

install:
	go install .
	perfsprint -h 2>&1 | head -n1
