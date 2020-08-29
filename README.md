# wikipedia-list-extractor
Wikipedia has lists of objects (e.g. monuments), often referenced by governmental data (e.g. heritage protection). This module helps to extract data from these lists.

In `data/` there are config files for each type of list.

# Usage
## Stand-alone on a PHP server (e.g. with Apache2)
```sh
cd /var/www/html
git clone https://github.com/plepe/wikipedia-list-extractor
cd wikipedia-list-extractor
npm install
```

Point your browser to https://server/wikipedia-list-extractor

## Stand-alone with NodeJS server (included with the dev dependencies)
```sh
git clone https://github.com/plepe/wikipedia-list-extractor
cd wikipedia-list-extractor
npm install
npm start
```

Point your browser to http://localhost:8080/

## As module within a NodeJS application
Wikipedia List Extractor uses a few modules (node-fetch, jsdom) as indirect dependencies (so they don't get compiled when using browserify). These have to be exposed as global variables. This can be done by requiring `wikipedia-list-extractor/node`.

## As module within a web application in a browser
As Wikipedia does not allow requests from a web browser, when they do not originate from a wikipedia page, we have to use a proxy. The URL of the proxy has to be supplied with the options, when loading MediawikiListExtractor:

```js
// def is the file data/INT-UNESCO.json as Javascript Object
new MediawikiListExtractor('INT-UNESCO', def, {
  proxy: 'proxy/?'
})
```

See `proxy/index.php` or `proxy/index.js` for examples.
