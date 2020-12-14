// MongoDB консоль, использованная при создании сервиса

show dbs;

use RegisterMovies;

db.getCollectionNames();

// Пример одного документа
db.RegisterMovies.find({}, {"_id": 0, "data.general.filmname": 1}).aggregate([{$unwind : "$data" } ] ).limit(1);
/*
{
  "_id": "5e0391871c266ee13d295b4c",
  "activated": "2019-12-25T16:42:16.974Z",
  "created": "2019-12-25T16:42:17.076Z",
  "data": {
    "info": {
      "path": "/cdm/v2/registries/RollingIdentities/2189878",
      "category": "registry-rolling-identity",
      "createDate": "2017-07-05T14:10:11+03:00",
      "updateDate": "2018-04-09T09:16:47+03:00"
    },
    "general": {
      "id": 2189878,
      "cardNumber": "121011310",
      "cardDate": "2010-06-25T12:00:00.000Z",
      "fullName": "ЗАО \"Вест\". ПРАВА ПРОКАТА НА ФИЛЬМ ПРЕКРАЩЕНЫ 07.07.2015",
      "foreignName": "The Twilight Saga: Eclipse",
      "applicantPhone": "495/6402751",
      "filmname": "Сумерки. Сага. Затмение /По произведению Стефани Майер/",
      "studio": "Саммит Интертейнмент, Темпл Хилл Интертейнмент, Маверик Филмз, Импринт Интертейнмент, Сансвепт Интертейнмент",
      "crYearOfProduction": "2010",
      "dubbing": "",
      "director": "Дэвид Слэйд",
      "scriptAuthor": "Стефани Майер, Мелисса Розенберг",
      "composer": "Говард Шор",
      "cameraman": "Хавьер Агирресаробе",
      "artdirector": "Кэтрин Ирча, Джереми Стенбридж",
      "producer": "Билл Баннерман, Марти Бауэн, Вик Годфри",
      "numberOfSeries": "1",
      "numberOfParts": "7 рулонов",
      "footage": "3396",
      "durationMinute": "4",
      "durationHour": "2",
      "color": "Цветной",
      "categoryOfRights": "Все  права",
      "ageCategory": "Зрителям, достигшим 14 лет",
      "annotation": "В ролях: Роберт Паттинсон, Кристен Стюарт. Экранизация.",
      "remark": "",
      "startDate": "2010-06-25",
      "psSdateTo": "25.05.2020",
      "viewMovie": "Художественный",
      "countryOfProduction": "США",
      "category": "Кино",
      "cadrFormat": "ш/э",
      "startDateRent": "2010-06-25T12:00:00.000Z",
      "owner": "АО \"ВЕСТ\"",
      "crRentalRightsTransferred": [],
      "deleted": false,
      "doNotShowOnSite": false,
      "ageLimit": "14",
      "registerApplication": [
        {
          "id": 2009354,
          "insertDate": "2017-07-05T14:02:12+03:00",
          "updateDate": "2017-07-05T14:02:12+03:00",
          "cardNumber": "121011310",
          "applicantEmpty": false,
          "applicationApplicant": [],
          "applicant": []
        }
      ]
    }
  },
  "dataset": "59b058015fa379c124e92869",
  "hash": "2018-04-09T09:16:47+03:00",
  "modified": "2019-12-25T16:42:17.076Z",
  "nativeId": "2189878",
  "nativeName": "Сумерки. Сага. Затмение /По произведению Стефани Майер/",
  "odSchema": "5c378a7544807d0641a316e2",
  "odSetVersion": "5e038ba4ce85043c3dd9cc63",
  "odSetVersions": ["5e038ba4ce85043c3dd9cc63"],
  "score": 1.1428571428571428,
  "status": 0,
  "updateSession": "5e038ba4ce85043c3dd9cc64"
}
*/

// Индекс для полнотекстового поиска
db.RegisterMovies.createIndex({
    "data.general.filmname":"text",
    "data.general.foreignName":"text",
    "data.general.annotation":"text"
});

// Удаление индекса для поиска
db.RegisterMovies.dropIndex("data.general.filmname_text_data.general.foreignName_text_data.general.annotation_text")

// Поиск через aggregate.
// Group необходим, так как данные дублируются под разными _id.
let searchQuery = "гарри поттер";
db.RegisterMovies.aggregate([
    {$match: {$text: {$search: searchQuery}}},
    {$group: {
            _id: {
                FilmName: "$data.general.filmname",
                ForeignName: "$data.general.foreignName",
                Studio: "$data.general.studio",
                YearOfProduction: "$data.general.crYearOfProduction",
                Director: "$data.general.director",
                ScriptAuthor: "$data.general.scriptAuthor",
                Composer: "$data.general.composer",
                Cameraman: "$data.general.cameraman",
                ArtDirector: "$data.general.artdirector",
                Producer: "$data.general.producer",
                NumberOfSeries: "$data.general.numberOfSeries",
                DurationMinute: "$data.general.durationMinute",
                DurationHour: "$data.general.durationHour",
                ViewMovie: "$data.general.viewMovie",
                CountryOfProduction: "$data.general.countryOfProduction"
            },
            TextScore: {$avg: {$meta: "textScore"}},
            ObjectId: {$min: "$_id"}
        }},
    {$project: {
            TextScore: "$TextScore",
            Id: "$ObjectId",
            _id: 0,
            FilmName: "$_id.FilmName",
            ForeignName: "$_id.ForeignName",
            Studio: "$_id.Studio",
            YearOfProduction: "$_id.YearOfProduction",
            Director: "$_id.Director",
            ScriptAuthor: "$_id.ScriptAuthor",
            Composer: "$_id.Composer",
            Cameraman: "$_id.Cameraman",
            ArtDirector: "$_id.ArtDirector",
            Producer: "$_id.Producer",
            NumberOfSeries: "$_id.NumberOfSeries",
            DurationMinute: "$_id.DurationMinute",
            DurationHour: "$_id.DurationHour",
            ViewMovie: "$_id.ViewMovie",
            CountryOfProduction: "$data.general.countryOfProduction",
        }},
    {$sort: {"TextScore": -1}},
    {$limit: 20},
])
