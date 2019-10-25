const fetch = require('node-fetch');
const cheerio = require('cheerio')
const querystring = require('querystring');

const fs = require('fs')
const {promisify} = require("util")
const fsp = {
  readdir: promisify(fs.readdir),
  readFile: promisify(fs.readFile),
  writeFile: promisify(fs.writeFile),
  exists: promisify(fs.exists),
  mkdir: promisify(fs.mkdir)
}

const lookups = require("./lookups.json")

main()

async function main() {

  // ensure we have output dir
  if (!(await fsp.exists('output'))) { fsp.mkdir("output") } 

  // export from jsFiddles
  // get all fiddles
  const allFiddles = await getAllFiddles()

  scrapeFiddles(allFiddles)
  
  // import to codepen

}


async function getAllFiddles() {
    // check locally first
    if (await fsp.exists('./output/fiddles.json')) {
        let data =  await fsp.readFile('./output/fiddles.json') // or require('./fiddles.json');
        return JSON.parse(data);
    } 

    // initialize and go find
    let allFiddles = []
    const limit = 99
    let found = 0

    do {
        const userName = "KyleMit"
        const params = { limit: limit, start: allFiddles.length }
        const url = `https://jsfiddle.net/api/user/${userName}/demo/list.json?${querystring.stringify(params)}`
        const resp = await fetch(url)
        const fiddles = await resp.json()

        found = fiddles.length
        allFiddles= allFiddles.concat(fiddles)

    }
    while (found === limit); // loop again if we hit cap

    // add some derived metadata fields
    allFiddles.forEach((el) => {
      el.id = el.url.split("/").splice(-2,1)[0] // //jsfiddle.net/KyleMit/y8ah3nf7/ -> y8ah3nf7
      el.url = el.url.replace('//','https://') // //jsfiddle.net/KyleMit/y8ah3nf7/ -> https://fiddle.jshell.net/KyleMit/y8ah3nf7/58/show/light/
    })

    // cache to file
    const fiddlesJson = JSON.stringify(allFiddles, null, 2)
    await fsp.writeFile('./output/fiddles.json', fiddlesJson)

    return allFiddles
}

async function scrapeFiddles(allFiddles) {

    for (let i = 0; i < allFiddles.length; i++) {
        const fiddle = allFiddles[i];
      
        await scrapeFiddle(fiddle)
    }

}

async function scrapeFiddle(fiddle) {

    // get html to scrape
    const resp = await fetch(fiddle.url)
    const html = await resp.text()
    const $ = cheerio.load(html)

    // get code html,css,js from script
    const configScript = $("head script:not([src])")[0].children[0].data
    var EditorConfig
    eval(configScript) // EditorConfig
    let code = EditorConfig.values

    // get fiddle settings
    let settingsInputs = $(".windowSettings select, .windowSettings input")
    let settingsValues = settingsInputs.serializeArray()
    settingsValues.forEach((el) => {
      // get mapping
      const lookup = lookups.find(lkp => lkp.name === el.name)
      if (lookup) {
          const option = lookup.items.find(opt => opt.value === el.value)
          if (option) {
            // add text description
            el.text = option.name
          }
      }
    })

    // get external links
    let links = $("#external_resources_list a.filename")
    let linkHrefs = links.map(el => el.attribs["href"]).get()

    // only save if we don't yet have
    if (!(await fsp.exists(`./output/${fiddle.id}`))) { 

      // ensure we have output dir
      fsp.mkdir(`./output/${fiddle.id}`) 

      // save json metadata
      const output = {
        meta: fiddle,
        settings: settingsValues,
        resources: linkHrefs
      }
      const outputJson = JSON.stringify(output, null, 2)
      await fsp.writeFile(`./output/${fiddle.id}/index.json`, outputJson)

      // save code contents
      await fsp.writeFile(`./output/${fiddle.id}/style.css`, code.css || "")
      await fsp.writeFile(`./output/${fiddle.id}/script.js`, code.js || "")
      await fsp.writeFile(`./output/${fiddle.id}/template.html`, code.html || "")

    } 


}



