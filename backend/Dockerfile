FROM golang:1.15 AS build-env

COPY ["./main.go", "./go.mod", "./go.sum", "${GOPATH}/src/github.com/OlegSchwann/FilmSearchService/"]

WORKDIR "${GOPATH}/src/github.com/OlegSchwann/FilmSearchService/"

RUN go mod download;

RUN go build -o '/go/bin/FilmSearchService' 'github.com/OlegSchwann/FilmSearchService';

FROM ubuntu:bionic

COPY --from=build-env ["/go/bin/FilmSearchService", "/go/bin/"]

CMD ["/go/bin/FilmSearchService"]
