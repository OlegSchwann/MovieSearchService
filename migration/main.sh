#! /usr/bin/env bash
set -o errexit -o nounset -o xtrace -o pipefail;

# https://opendata.mkrf.ru/opendata/7705851331-register_movies
if wget --no-verbose 'https://opendata.mkrf.ru/opendata/7705851331-register_movies/data-6-structure-3.json.zip'; then
  MIGRATION_DATA='data-6-structure-3.json.zip';
else
  echo 'Failed to download new data, fallback to 14.12.2020 edition.' 1 > '/dev/stderr';
  MIGRATION_DATA='old.data-6-structure-3.json.zip';
fi

unzip "${MIGRATION_DATA}";
for FILE in *'.json'; do
  mongoimport \
    --host '[::]' \
    --port 27017 \
    --db RegisterMovies \
    --collection RegisterMovies \
    --jsonArray \
    --file "${FILE}";
done

# language=MongoDB
mongo --ipv6 'mongodb://[::]:27017/RegisterMovies' <<EOF
db.RegisterMovies.createIndex({
    "data.general.filmname": "text",
    "data.general.foreignName": "text",
    "data.general.annotation": "text"
});
EOF
