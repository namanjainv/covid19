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
    let myData = { };
    let url = 'https://spreadsheets.google.com/feeds/cells/'+sheet_code+'/1/public/full?alt=json';
    $.getJSON(url, function(data) {
        myData[ "Cases Registered" ] = data.feed.entry;
        url = 'https://spreadsheets.google.com/feeds/cells/'+sheet_code+'/2/public/full?alt=json';
        $.getJSON(url, function(data) {
            myData[ "Cases Recovered" ] = data.feed.entry;
            url = 'https://spreadsheets.google.com/feeds/cells/'+sheet_code+'/3/public/full?alt=json';
            $.getJSON(url, function(data) {
                myData[ "Cases Fatal" ] = data.feed.entry;
                generateStatesMap( myData );
            });
        });
    });
}

function generateStatesMap( data ) {
    const dateRow = 2;
    const stateColumn = 1;
    let stateRowMap = { };
    let dateColMap = { };
    data[ "Cases Registered" ].forEach(spreadSheetCell => {
        // To handle States
        if( parseInt( spreadSheetCell.gs$cell.col ) === stateColumn 
                && parseInt( spreadSheetCell.gs$cell.row ) > dateRow ) {
            if( map[ spreadSheetCell.gs$cell.inputValue ] === undefined ) {
                if( spreadSheetCell.gs$cell.inputValue === "Total Cases In India" ) {
                    map[ "Overall" ] = { }
                    stateRowMap[ spreadSheetCell.gs$cell.row ] = "Overall";
                }
                else if( spreadSheetCell.gs$cell.inputValue === "Telengana" ) {
                    map[ "Telangana" ] = { }
                    stateRowMap[ spreadSheetCell.gs$cell.row ] = "Telangana";
                }
                else if( spreadSheetCell.gs$cell.inputValue === "Odisha" ) {
                    map[ "Orissa" ] = { }
                    stateRowMap[ spreadSheetCell.gs$cell.row ] = "Orissa";
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

    data[ "Cases Recovered" ].forEach( spreadSheetCell2 => {
        // To handle Data
        if( parseInt( spreadSheetCell2.gs$cell.col ) > stateColumn + 1
                && parseInt( spreadSheetCell2.gs$cell.row ) > dateRow ) {
            map[ stateRowMap[ spreadSheetCell2.gs$cell.row ] ][ dateColMap[ spreadSheetCell2.gs$cell.col  ] ]["Cases Recovered" ] = spreadSheetCell2.gs$cell.inputValue;
            
        }
    } );

    data[ "Cases Fatal" ].forEach( spreadSheetCell3 => {
        // To handle Data
        if( parseInt( spreadSheetCell3.gs$cell.col ) > stateColumn + 1
                && parseInt( spreadSheetCell3.gs$cell.row ) > dateRow ) {
            map[ stateRowMap[ spreadSheetCell3.gs$cell.row ] ][ dateColMap[ spreadSheetCell3.gs$cell.col  ] ]["Cases Fatal" ] = spreadSheetCell3.gs$cell.inputValue;
        }

    } );

    console.log( map );
    
    fillColor( );
    generateGraph(  );
}

function fillColor( ) {
    
    const graphStates = {
        "Level0": {
            class: 'Level0',
            start: 1
        },
        "Level1": {
            class: 'Level1',
            start: 10
        },
        "Level2": {
            class: 'Level2',
            start: 30
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
        let content = ''
        if( stateName != null ) {
            content = '<h5> ' + stateName + ' </h5>';
            if( map[ stateName ] != undefined ) {
                if( map[ stateName ][ today ] != undefined ) {
                    content += '<p> Registered Cases: ' + map[ stateName ][ today ][ "Cases Registered" ] + '<br />';
                    content += 'Recovered Cases: ' + map[ stateName ][ today ][ "Cases Recovered" ] + '<br />';
                    content += 'Fatal Cases: ' + map[ stateName ][ today ][ "Cases Fatal" ] + '</p>';
                    let myClass = getMyState( map[ stateName ][ today ][ "Cases Registered" ] );
                    mapDOM.children[i].classList.add(myClass); 
                }
                else {
                    mapDOM.children[i].classList.add("noneArea"); 
                    content += '<p> No Data Available </p>';
                }
            }
            else {
                mapDOM.children[i].classList.add("noneArea"); 
                content += '<p> No Data Available </p>';
            }  
        }
        
        $('svg [name="'+stateName+'"]').tooltip({
            title: content,
            html: true,
            placement: "bottom"
        });
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

function generateGraph( ) {
    states = Object.keys( map );
    states.sort( );
    var select = document.getElementById("stateDropDown"); 
    states.forEach( state => {
        if( state != "Overall" ) {
            var el = document.createElement( 'option' );
            el.textContent = state;
            el.value = state;
            select.appendChild( el );
        }
    });

    generateSplineChart( );
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
    var inString = mm + '/' + dd + '/' + yyyy; 
    return inString;
}

function generateSplineChart(  ) {
    
    var selectedStates = $('#stateDropDown').val( );

    var graphJson = [ ];
    Object.keys( map[ selectedStates ] ).forEach( date => {
        graphJson.push({ 
            "date": new Date( date ), 
            "state": selectedStates, 
            "Registered Cases": map[ selectedStates ][ date ][ "Cases Registered" ],
            "Recovered Cases": map[ selectedStates ][ date ][ "Cases Recovered" ],
            "Fatal Cases": map[ selectedStates ][ date ][ "Cases Fatal" ],
        });
    } );

    var chart = c3.generate({
        bindto: '#chart',
        data: {
            json: graphJson,
            keys: {
                x: 'date', 
                value: ["Registered Cases", "Recovered Cases", "Fatal Cases" ],
            },
            colors: {
                "Registered Cases": '#3B5998',
                "Recovered Cases": '#188038',
                "Fatal Cases": '#d04c48'
            },
        },
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    format: '%d-%m'
                },
                culling: true
            }
        }
    });
    
    document.getElementById('dashboardMeter-valueTotal').innerText = map[ selectedStates ][ parseDate( lastDate ) ][ "Cases Registered" ] ;
    document.getElementById('dashboardMeter-valueRecovered').innerText = map[ selectedStates ][ parseDate( lastDate ) ][ "Cases Recovered" ] ;
    document.getElementById('dashboardMeter-valueFatal').innerText = map[ selectedStates ][ parseDate( lastDate ) ][ "Cases Fatal" ] ;
}





/**  END OF FUNCTIONS  */