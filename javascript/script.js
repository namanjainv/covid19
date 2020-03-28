/**
 * Handle JS for Covid-19. 
 *
 * Loads file has functions to handle the web page.
 *
 * @file   Script.js.
 * @author https://namanjainv.github.io.
 * @since  x.x.x
 */

/**  CONSTANTS  */
let map = { }
let lastDate = new Date( '01/01/2000' );


/**  FUNCTIONS  */

function init(  ) {
    // Ref: https://www.labnol.org/code/covid-19-india-tracker-200325
    // Ref: https://www.freecodecamp.org/news/cjn-google-sheets-as-json-endpoint/
    const sheet_code = '1VTAuLT22gl5aZi3eMACO5mKkOIYxeM5ffW21_1OVymg';
    let url = 'https://spreadsheets.google.com/feeds/cells/'+sheet_code+'/1/public/full?alt=json'
    $.getJSON(url, function(data) {
        generateStatesMap( data.feed.entry );
    });
}

function generateStatesMap( data ) {
    const dateRow = 2;
    const stateColumn = 1;
    let stateRowMap = { };
    let dateColMap = { };
    data.forEach(spreadSheetCell => {
        // To handle States
        if( parseInt( spreadSheetCell.gs$cell.col ) === stateColumn 
                && parseInt( spreadSheetCell.gs$cell.row ) > dateRow ) {
            if( map[ spreadSheetCell.gs$cell.inputValue ] === undefined ) {
                if( spreadSheetCell.gs$cell.inputValue === "Total Cases In India" ) {
                    map[ "Overall" ] = { }
                    stateRowMap[ spreadSheetCell.gs$cell.row ] = "Overall";
                }
                else { 
                    map[ spreadSheetCell.gs$cell.inputValue ] = { }
                    stateRowMap[ spreadSheetCell.gs$cell.row ] = spreadSheetCell.gs$cell.inputValue;
                }
            }
        }

        // To handle Dates
        if( parseInt( spreadSheetCell.gs$cell.col ) > stateColumn 
                && parseInt( spreadSheetCell.gs$cell.row ) === dateRow ) {
            var dateParts = spreadSheetCell.gs$cell.inputValue.split(" ")[0].split("/");
            let currDate = new Date( dateParts[2], dateParts[1] - 1, dateParts[0] ); 
            if( lastDate < currDate ) 
                lastDate = currDate ;
            
            dateColMap[ spreadSheetCell.gs$cell.col ] = parseDate( currDate );
        }

        // To handle Data
        if( parseInt( spreadSheetCell.gs$cell.col ) > stateColumn + 1
                && parseInt( spreadSheetCell.gs$cell.row ) > dateRow ) {
            map[ stateRowMap[ spreadSheetCell.gs$cell.row ] ][ dateColMap[ spreadSheetCell.gs$cell.col  ] ] = {
                "Cases Registered": spreadSheetCell.gs$cell.inputValue
            }
        }
        
    });
    console.log( map );
    
    fillColor( );
}

function fillColor( ) {
    const graphStates = {
        "Level0": {
            class: 'Level0',
            start: 0
        },
        "Level1": {
            class: 'Level1',
            start: 5
        },
        "Level2": {
            class: 'Level2',
            start: 20
        },
        "Level3": {
            class: 'Level3',
            start: 50
        },
        "Level4": {
            class: 'Level4',
            start: 100
        },
        "Level5": {
            class: 'Level5',
            start: 200
        },
        "Level6": {
            class: 'Level6',
            start: 300
        }
    }
    let today = parseDate( lastDate );
    var mapDOM = document.getElementById( 'indiaMap' );
    for( var i = 0; i < mapDOM.children.length; i++ ) {
        mapDOM.children[i].classList.add("default"); 
        let stateName = mapDOM.children[i].getAttribute("name");
        if( stateName != null ) {
            if( map[ stateName ] != undefined ) {
                if( map[ stateName ][ today ] != undefined ) {
                    let myClass = getMyState( map[ stateName ][ today ][ "Cases Registered" ] );
                    mapDOM.children[i].classList.add(myClass); 
                }
            }
            else {
                mapDOM.children[i].classList.add("noneArea"); 
            }  
        }
    }

    function getMyState( value ) {
        value = parseInt( value );
        let prev = 'Level0';
        Object.keys( graphStates ).forEach( graphState => {
            if( value < graphStates[ graphState ].start )
                return prev;
            else 
                prev = graphState;
        });
        return prev;
    }
}

function parseDate( date ) {
    var dd = date.getDate(); 
    var mm = date.getMonth() + 1; 

    var yyyy = date.getFullYear(); 
    if (dd < 10) { 
        dd = '0' + dd; 
    } 
    if (mm < 10) { 
        mm = '0' + mm; 
    } 
    var inString = dd + '/' + mm + '/' + yyyy; 
    return inString;
}

/**  END OF FUNCTIONS  */