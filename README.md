# wikipedia-list-extractor
Wikipedia has lists of objects (e.g. monuments), often referenced by governmental data (e.g. heritage protection). This module helps to extract data from these lists.

In `data/` there are config files for each type of list.

# Usage
## Stand-alone with NodeJS server (included with the dev dependencies)
```sh
git clone https://github.com/plepe/wikipedia-list-extractor
cd wikipedia-list-extractor
npm install
npm start
```

Point your browser to http://localhost:8080/ for the interactive App.

You can try the list 'AT-BDA' and as ID 'id-24536' or 'Q1534177'. Both IDs should return the Goethedenkmal in Vienna.

Additionally, the standalone server exposes a HTTP API which you can query:
http://localhost:8080/api/<list>/<id>
- where list is the ID of a list (e.g. INT-UNESCO)
- where id is one or several ids, comma separated

Example:
```sh
curl http://localhost:8080/api/INT-UNESCO-de/91,80
```

## As module within a NodeJS application
Wikipedia List Extractor uses a few modules (node-fetch, jsdom) as indirect dependencies (so they don't get compiled when using browserify). These have to be exposed as global variables. This can be done by requiring `wikipedia-list-extractor/node`.

```js
let extractor = new MediawikiListExtractor('INT-UNESCO-de', def)
extractor.get(['91', '80'], (err, result) => {
  console.log(err, JSON.stringify(result, null, '  '))
})
```

## Stand-alone on a PHP server (e.g. with Apache2)
```sh
cd /var/www/html
git clone https://github.com/plepe/wikipedia-list-extractor
cd wikipedia-list-extractor
npm install
```

Point your browser to https://server/wikipedia-list-extractor

You have to select 'Run code in browser', as the PHP code does not implement the server side.

## As module within a web application in a browser
As Wikipedia does not allow requests from a web browser, when they do not originate from a wikipedia page, we have to use a proxy. The URL of the proxy has to be supplied with the options, when loading MediawikiListExtractor:

```js
// def is the file data/INT-UNESCO.json as Javascript Object
let extractor = new MediawikiListExtractor('INT-UNESCO', def, {
  proxy: 'proxy/?'
})
extractor.get(['91', '80'], (err, result) => {
  console.log(err, result)
})
```

See `proxy/index.php` or `proxy/index.js` for examples.

# List definition files
The list definition files are in the `data/` folder and these are YAML files. The basic structure:

```yaml
title:
  en: List for something
param:
  ... Definition for a source or several sources
```

Definition of a source:
```yaml
language: de
source: https://de.wikipedia.org
pageTitleMatch: Liste der Kunstwerke
renderedFields:
  id:
    column: 2
    regexp: /<a[^>]*>([0-9]+)<\/a>/
    type: html
  wikidata:
    column: 3
    regexp: /<a href="https:\/\/www.wikidata.org\/wiki\/(Q[0-9]+)">Wikidata<\/a>/
    type: html
```

For sources, the following options are possible

| Field | Description                                |
| ----- | ------------------------------------------ |
| language | Language of this list |
| source | URL of the Mediawiki / Wikipedia where this list is to be found |
| pageTitleMatch | The template title for pages which build this page (e.g. there might be a list of artwork for each town). This is a regular expression for [Mediawiki CirrusSearch](https://www.mediawiki.org/wiki/Help:CirrusSearch#Regular_expression_searches), so there might be some restrictions. |
| template | Mediawiki pages use the specified template (or, when this is an array, templates) for rendering content. |
| rawIdField | The id of the item can be read from this field (in the template in page source). |
| rawAnchorField | The HTML anchor of the item can be read from this field (in the template in page source). |
| rawWikidataField | The wikidata id of the item can be read from this field (in the template in page source). |
| renderedTableClass | In rendered output, the table in the page can be detected from this class. |
| renderedIdField | The id of the item can be read from this field (in the rendered output, see renderedFields). |
| renderedAnchorField | The HTML anchor of the item can be read from this field (in the rendered output, see renderedFields). |
| renderedWikidataField | The wikidata id of the item can be read from this field (in the rendered output, see renderedFields). |
| renderedFields | Hashed array of fields, see below. |
| wikidataFields | Optionally load the specified list of fields from the matching wikidata item. Example: `[{property: P31, field: "is_a"}, ...]` |


Advanced Fields:

| Field | Description                                |
| ----- | ------------------------------------------ |
| rawAnchorTemplate | Complex HTML anchor for the item. Uses Twig syntax to compile the anchor. Available parameters: `item.field` (with each field from the template), `page` (page title), `index` (index of the item on this page). |
| rawIdTemplate | More complex ID and aliases for the item. Uses Twig syntax to compile the ID/Aliases (one alias per line). Make sure that the first result is always the same as the first ID in `renderedIdTemplate`. Available parameters: `item.field` (with all fields from the template), `page` (page title), `index` (index of the item on this page). |
| renderedAnchorTemplate | Complex HTML anchor for the item. Uses Twig syntax to compile the anchor. Available parameters: `item.field` (with each field from the template), `page` (page title), `index` (index of the item on this page). |
| renderedIdTemplate | More complex ID and aliases for the item. Uses Twig syntax to compile the ID/Aliases (one alias per line). Make sure that the first result is always the same as the first ID in `rawIdTemplate`. Available parameters: `item.field` (with all parsed fields from the rendered page), `page` (page title), `index` (index of the item on this page). |
| wikidataIdTemplate | Additional aliases for the item. Uses Twig syntax to compile the alias (one alias per line). Available parameters: `item.P1234` (with all properties specified in wikidataFields). |
| idToQuery | When searching for an ID, how to search on the Mediawiki site. idToQuery uses Twig syntax to generate the query, with multiple lines prefixed by a query option and `=`; available parameter: `id` (the id we are looking for). Query options: `field` (which field to query), `value` (which value to query), `wikidataProperty` and `wikidataValue` (value can't be found in the page source, needs to query wikidata first -> use wikidata item id as value), `page` (doesn't need to search, just load the specified page). |

Rendered Fields Parameter:

| Parameter | Description                                |
| ----- | ------------------------------------------ |
| column | Table column |
| regexp | A regular expression, where the first match is the resulting value (to exclude patterns, use: `/foo(?:bar)(bla)/` -> "bla". |
| type | 'html' (default), 'image' (parse url, width, height from first image in this field) |
