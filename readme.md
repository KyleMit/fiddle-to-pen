# Fiddle To Pen

A migration told in two steps

1. Export [jsFiddle](https://jsfiddle.net/) to Files
2. Import code into [CodePen.io](https://codepen.io/)

## Create lookups.json

Run this following in the console on jsFiddle.net to generate the lookup list for `option` elements

```js
let settingSelects = document.querySelectorAll(".windowSettings select")
let settingLookups = [...settingSelects].map(sel => {
    let lookup = { name: sel.name
    let opts = sel.querySelectorAll("option")

    lookup.items = [...opts].map(opt => {
        return {
            name: opt.innerText,
            value: opt.value
        }

    return lookup
})
```

## Resources

### JavaScript

* [js - get characters between slashes](https://stackoverflow.com/q/8519734/1366033)
* [js - get the second to last item of an array](https://stackoverflow.com/a/24331358/1366033)
* [js - Async and Await with Array.map()](https://flaviocopes.com/javascript-async-await-array-map/)

### Node

* [node - Using filesystem in node.js with async / await](https://stackoverflow.com/a/58332163/1366033)
* [node - how to create a directory if doesn't exist?](https://stackoverflow.com/q/21194934/1366033)
* [node - skip internal modules](https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_skipping-uninteresting-code-node-chrome)
