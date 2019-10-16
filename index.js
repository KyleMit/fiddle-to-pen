const fetch = require('node-fetch');
const cheerio = require('cheerio')
const querystring = require('querystring');

const fs = require('fs')
const {promisify} = require("util")
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const exists = promisify(fs.exists)

main()

async function main() {

    const allFiddles = await getAllFiddles()

    scrapeFiddles(allFiddles)

}


async function getAllFiddles() {
    // check locally first
    if (await exists('./fiddles.json')) {
        let data =  await readFile('./fiddles.json') // or require('./fiddles.json');
        return JSON.parse(data);
    } 

    // initialize and go find
    let allFiddles = []

    const limit = 99 // max value
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
    while (found == limit); // loop again if we hit cap

    // save for future use
    const fiddlesJson = JSON.stringify(allFiddles, null, 2)
    await writeFile('./fiddles.json', fiddlesJson)

    return allFiddles
}

async function scrapeFiddles(allFiddles) {

    // test TODO remove
    allFiddles = allFiddles.splice(0, 3)

    for (let i = 0; i < allFiddles.length; i++) {
        const fiddle = allFiddles[i];

        await scrapeFiddle(fiddle)

    }

}

async function scrapeFiddle(fiddle) {

    // //jsfiddle.net/KyleMit/y8ah3nf7/ -> https://fiddle.jshell.net/KyleMit/y8ah3nf7/58/show/light/
    let url = fiddle.url.replace("//jsfiddle.net/", "https://fiddle.jshell.net/") + "show/light/"
    const resp = await fetch(url)
    const html = await resp.text()

    var htmlParser = new DOMParser();
    htmlDoc = htmlParser.parseFromString(html, "text/html");
}



function ScrapeFiddleMetaData(html, fiddle) {
  var htmlParser = new DOMParser();
  htmlDoc = htmlParser.parseFromString(html, "text/html");


  fiddle.code = {}
  fiddle.lib = {}

  // get HTML Code (sanitize fiddle content)
  var embedParentFrameScript = htmlDoc.body.lastElementChild
  htmlDoc.body.removeChild(embedParentFrameScript)
  fiddle.code.html = htmlDoc.body.innerHTML.trim();

  // get JS Code  (sanitize fiddle content)
  var allScripts = [].slice.call(htmlDoc.scripts)
	var inlineScripts  = allScripts.filter(function(el) { return !el.src })
	fiddle.code.script = inlineScripts.length == 0 ? "" :  
  		inlineScripts[0].innerHTML.trim()
                      .replace(/^window\.onload=function\(\){/,"")
                      .replace(/}$/, "")
                      .trim();

  // get CSS Code
  fiddle.code.style = htmlDoc.head.getElementsByTagName('style')[0].innerHTML.trim()

  // get external scripts
  fiddle.lib.scripts = allScripts.map(function(el) {
    return el.src;
  }).filter(function(el) {
    return el && el.indexOf("fiddle.jshell.net") === -1
  });

  // get external styles
  var externalStyles = [].slice.call(htmlDoc.getElementsByTagName('link'))
  fiddle.lib.styles = externalStyles.map(function(el) {
    return el.href;
  }).filter(function(el) {
    return el && el.indexOf("fiddle.jshell.net") === -1
  });
}




async function LoadPage() {


  GetTotalCount(url)
}



function GetTotalCount(url) {
  var countPromise = $.ajax({
      url: url, 
      data: {limit: 0 },
      dataType: 'jsonp',
      success: function(data, textStatus, jqXHR) {
      debugger;
		     localStorage.setObject('totalFiddles', +data.overallResultSetCount);
      }
    });

  $.when(countPromise)
   .done(function(data, textStatus, jqXHR) {
    GetAllFiddles(url);
  });
};
   

function GetAllFiddles(url) {
  // check if we need to parse fresh
  var totalCount = localStorage.getObject('totalFiddles');
  var allFiddles = localStorage.getObject('allFiddles');
  
  if (allFiddles != null && allFiddles.length == totalCount) {
      // go straight to render if we are consistent
      GetAllFiddleMetadata()
      
  } else {
    // something changed, grab all fresh
    localStorage.setObject('allFiddles', []);
    var limit = 99;
    var promises = []
    for(var i = 0; i < totalCount / limit; i++) {
      promises.push(GetFiddleList(i,limit,url))
    }

    // when all the promises are done, start next step
    $.when.apply(this, promises)
     .done(function () {
      GetAllFiddleMetadata()
    });
  }
  
}

function GetFiddleList(i, inc, url) {
    return $.ajax({
      url: url, 
      data: {
        start: 0 + i * inc,
        limit: inc,
      },
      dataType: 'jsonp',
      success: function(data) {
        var allFiddles = localStorage.getObject('allFiddles');
        
        if (allFiddles == null) allFiddles = [];
        allFiddles = allFiddles.concat(data.list)
        
        localStorage.setObject('allFiddles', allFiddles);
      }
    });
}



function GetAllFiddleMetadata() {
   var allFiddles = localStorage.getObject('allFiddles');
   var promises = []

		allFiddles.forEach(function(fiddle) {
      if (!fiddle.parseVersion || fiddle.parseVersion != fiddle.latest_version) {
      	promises.push(GetFiddleMetadata(fiddle))
      }
    })
    
    // when all the promises are done, start next step
    $.when.apply(this, promises)
     .done(function () {
			debugger;
			// take a snapshot of our changes
      localStorage.setObject('allFiddles', allFiddles);

      RenderFiddles()
    });
}
function GetFiddleMetadata(fiddle) {
   fiddle.showUrl = fiddle.url.replace("//jsfiddle.net/", "https://fiddle.jshell.net/") + "show/light/"
   //       //jsfiddle.net/KyleMit/UBJn2/
   // https://fiddle.jshell.net/KyleMit/y8ah3nf7/58/show/light/
     
   var getFiddlePromise = $.ajax({
      url: fiddle.showUrl, 
      success: function(data, textStatus, jqXHR) {
         // hunt and peck for info from the live fiddle
		     ScrapeFiddleMetaData(data, fiddle)
         
				 // indicate that we've parsed this version
				 fiddle.parseVersion = fiddle.latest_version;
      }
    });
    
    return getFiddlePromise;
}


function RenderFiddles() {
   var allFiddles = localStorage.getObject('allFiddles');
   

   // format for tablesorter
   var allFiddlesArray = allFiddles.map(function(fiddle) {
   		return { 
        cells: [
           { html: "<a href='"+ fiddle.url + "'>"+ escapeHtml(fiddle.title) + "</a>" }, 
           { text: moment(fiddle.created).format("MM/DD/YYYY") , class:"text-center"}, 
           { html: "<a href='"+ fiddle.url + fiddle.latest_version + "'>"+ fiddle.latest_version + "</a>" , class:"text-center"}
        ]
      }
   })
   
   var tablesorterTable = {
     headers: [[
         { text: "Title" }, 
         { text: "Created", class:"text-center", width:"110px" }, 
         { text: "Latest Ver." , class:"text-center", width:"50px"  }
        ]],
     footers: [[]],
     rows: allFiddlesArray
   }

   
   $("#results")
     .empty()
     .tablesorter({
      theme: 'materialize',
      widgets: ['zebra', "uitheme", "filter", "mark"],
      sortList: [[1,1]],
      headers: {
        1: { sorter: 'shortDate', dateFormat: "mmddyyyy" },
        2: { sorter: 'digit' },
      },
      data: tablesorterTable,
      widgetOptions: {
        filter_cssFilter: "form-control"

      }
    });
   

   
}


// escape html special chars - https://stackoverflow.com/a/6234804/1366033
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

