Vue.createApp({
    data() {
        return {
            SearchRequest: "",
            SearchResults: [],
        }
    },
    methods: {
        SearchFilm(event) {
            const query = event.target.value;
            if (query.length < 2) {
                return
            }
            fetch(`http://localhost:8080/v1/search-film?q=${query}&utf8=✓`)
                .then((response) => {
                    if (response.status === 200) { // ok
                        return response.json();
                    } else if (response.status === 204) { // no content
                        return Promise.resolve([])
                    }
                })
                .then((data) => {
                    this.SearchResults.length = 0;
                    this.SearchResults.push(...data);
                })
        }
    }
}).mount('#app');
