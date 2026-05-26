var DataCache = (function() {
    'use strict';
    var _pending = {};
    var _resolved = {};

    function fetchJSON(url) {
        var absolute = new URL(url, document.baseURI).href;

        if (_resolved[absolute] !== undefined) {
            return Promise.resolve(JSON.parse(JSON.stringify(_resolved[absolute])));
        }

        if (_pending[absolute]) {
            return _pending[absolute].then(function(data) {
                return JSON.parse(JSON.stringify(data));
            });
        }

        _pending[absolute] = fetch(url)
            .then(function(response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(function(data) {
                _resolved[absolute] = data;
                delete _pending[absolute];
                return JSON.parse(JSON.stringify(data));
            })
            .catch(function(err) {
                delete _pending[absolute];
                throw err;
            });

        return _pending[absolute];
    }

    return { fetchJSON: fetchJSON };
})();
