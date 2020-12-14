package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/sethvargo/go-envconfig"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Config struct {
	MongoDB    string `env:"MONGODB_CONNECTION_STRING"` // mongodb://[::]:27017
	DataBase   string `env:"MONGODB_DATABASE"`          // RegisterMovies
	Collection string `env:"MONGODB_COLLECTION"`        // RegisterMovies
	ListenPost string `env:"LISTEN_PORT"`               // 8080
}

type Film struct {
	Annotation          string
	FilmName            string
	ForeignName         string
	Studio              string
	YearOfProduction    string
	Director            string
	ScriptAuthor        string
	Composer            string
	Cameraman           string
	ArtDirector         string
	Producer            string
	NumberOfSeries      string
	DurationMinute      string
	DurationHour        string
	ViewMovie           string // ["Художественный", "Анимационный", "Документальный", "Научно-популярный", "КиноПериодика", "Прочие"]
	CountryOfProduction string
}

type SearchRequest string

type SearchResponse []Film

type RegisterMovies struct {
	config Config
	ctx context.Context
	client *mongo.Client
}

func (rm *RegisterMovies)SearchByName(req SearchRequest) (searchResponse SearchResponse, _ error) {
	collection := rm.client.Database(rm.config.DataBase).Collection(rm.config.Collection)

	cursor, err := collection.Find(rm.ctx,
		bson.D{bson.E{"$text", bson.D{bson.E{"$search", req}}}},
		options.Find().
			SetSort(bson.D{bson.E{"score", bson.D{bson.E{"$meta", "textScore"}}}}).
			SetLimit(20).
			SetProjection(bson.M{
				"_id":                 0,
				"Id":                  "$_id",
			    "Annotation":          "$data.general.annotation",
				"FilmName":            "$data.general.filmname",
				"ForeignName":         "$data.general.foreignName",
				"Studio":              "$data.general.studio",
				"YearOfProduction":    "$data.general.crYearOfProduction",
				"Director":            "$data.general.director",
				"ScriptAuthor":        "$data.general.scriptAuthor",
				"Composer":            "$data.general.composer",
				"Cameraman":           "$data.general.cameraman",
				"ArtDirector":         "$data.general.artdirector",
				"Producer":            "$data.general.producer",
				"NumberOfSeries":      "$data.general.numberOfSeries",
				"DurationMinute":      "$data.general.durationMinute",
				"DurationHour":        "$data.general.durationHour",
				"ViewMovie":           "$data.general.viewMovie", 
				"CountryOfProduction": "$data.general.countryOfProduction",
			}).
			SetMaxTime(3 * time.Second),
	)
	if err != nil {
		return nil, fmt.Errorf("fail to find for film for request '%s': %w", req, err)
	}

	err = cursor.All(rm.ctx, &searchResponse)
	if err != nil {
		return nil, fmt.Errorf("fail to parce search result for request '%s': %w", req, err)
	}

	return searchResponse, nil
}

type App struct {
	registerMovies RegisterMovies
}

var _ http.HandlerFunc = (*App)(nil).SearchByName

func (a *App)SearchByName(w http.ResponseWriter, r *http.Request) {

	_query, ok := r.URL.Query()["q"]
	if !ok || len(_query) != 1 || len(_query[0]) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("expected 'q' parametr with search query string, but got: %v", _query)))
		return
	}
	query := SearchRequest(_query[0])

	listOfFilms, err := a.registerMovies.SearchByName(query)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("err in App.SearchByName: %e", err)))
		return
	}
	if len(listOfFilms) == 0 {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(listOfFilms)
}


func main() {
	ctx := context.Background()

	var config Config
	if err := envconfig.Process(ctx, &config); err != nil {
		log.Fatal(err)
	}

	client, err := mongo.NewClient(options.Client().ApplyURI(config.MongoDB))
	if err != nil {
		log.Fatal(err)
	}

	err = client.Connect(ctx)
	if err != nil {
		log.Fatal(err)
	}

	defer client.Disconnect(ctx)

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	app := App{
		registerMovies: RegisterMovies{
			config: config,
			ctx:    ctx,
			client: client,
		},
	}

	http.HandleFunc("/v1/search-film", app.SearchByName)

	err = http.ListenAndServe(":"+config.ListenPost, nil)
	if err != nil {
		log.Fatalf("failed http.ListenAndServe: %e", err)
	}
}
