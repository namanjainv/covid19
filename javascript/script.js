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
                testingCentersData( );
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
                else if( spreadSheetCell.gs$cell.inputValue === "Uttarakhand" ) {
                    map[ "Uttaranchal" ] = { }
                    stateRowMap[ spreadSheetCell.gs$cell.row ] = "Uttaranchal";
                }
                else if( spreadSheetCell.gs$cell.inputValue === "Andaman and Nicobar Islands" ) {
                    map[ "Andaman and Nicobar" ] = { }
                    stateRowMap[ spreadSheetCell.gs$cell.row ] = "Andaman and Nicobar";
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

    Object.keys( map ).forEach( state => {
        Object.keys( map[ state ] ).forEach( date => {
            map[state][date][ "Cases Active" ] = parseInt( map[ state ][ date ][ "Cases Registered" ] ) - parseInt( map[ state ][ date ][ "Cases Recovered" ] ) - parseInt( map[ state ][ date ][ "Cases Fatal" ] );
        });
    } );
    
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
            start: 25
        },
        "Level2": {
            class: 'Level2',
            start: 50
        },
        "Level3": {
            class: 'Level3',
            start: 100
        },
        "Level4": {
            class: 'Level4',
            start: 200
        },
        "Level5": {
            class: 'Level5',
            start: 300
        },
        "Level6": {
            class: 'Level6',
            start: 500
        }
    }
    let today = parseDate( lastDate );
    var mapDOM = document.getElementById( 'indiaMap' );
    for( var i = 0; i < mapDOM.children.length; i++ ) {
        mapDOM.children[i].classList.add("default"); 
        let stateName = mapDOM.children[i].getAttribute("name");
        let id = getMyStateId( stateName );
        let content = ''
        if( stateName != null ) {
            content = '<h5> ' + tr[ id ][ currentLanguage ] + ' </h5>';
            if( map[ stateName ] != undefined ) {
                if( map[ stateName ][ today ] != undefined ) {
                    content += '<p> ' + tr[ "total" ][ currentLanguage ] + ': ' + map[ stateName ][ today ][ "Cases Registered" ] + '<br />';
                    content +=  tr[ "active" ][ currentLanguage ] + ': ' + (map[ stateName ][ today ][ "Cases Active" ] + '<br />' );
                    content +=  tr[ "cured" ][ currentLanguage ] + ': ' + map[ stateName ][ today ][ "Cases Recovered" ] + '<br />';
                    content +=  tr[ "death" ][ currentLanguage ] + ': ' + map[ stateName ][ today ][ "Cases Fatal" ] + '</p>';
                    let myClass = getMyState( map[ stateName ][ today ][ "Cases Registered" ] );
                    mapDOM.children[i].classList.add(myClass); 
                }
                else {
                    mapDOM.children[i].classList.add("noneArea"); 
                    content += '<p>' + tr[ "nda" ][ currentLanguage ] + ' </p>';
                }
            }
            else {
                mapDOM.children[i].classList.add("noneArea"); 
                content += '<p> ' + tr[ "nda" ][ currentLanguage ] + ' </p>';
            }  
        }

        $('svg [name="'+stateName+'"]').tooltip({
            title: content,
            html: true,
            placement: "bottom"
        });
        $('svg [name="'+stateName+'"]').tooltip('hide')
                        .attr('data-original-title', content)
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

function getMyStateId( stateName ) {
    let id = 'menu1'
    statesJSON.forEach( record => { 
        if( record.state === stateName ) id = record.id; 
    });
    return id;
}

let statesJSON = [ 
    { active: true, state: "Andaman and Nicobar", id: "state1" },
    { active: true, state: "Overall", id: "menu1" },
    { active: true, state: "Andhra Pradesh", id: "state2" },
    { active: true, state: "Arunachal Pradesh", id: "state32" },
    { active: true, state: "Assam", id: "state30" },
    { active: true, state: "Bihar", id: "state3" },
    { active: true, state: "Chandigarh", id: "state4" },
    { active: true, state: "Chhattisgarh", id: "state5" },
    { active: true, state: "Delhi", id: "state6" },
    { active: true, state: "Goa", id: "state7" },
    { active: true, state: "Gujarat", id: "state8" },
    { active: true, state: "Haryana", id: "state9" },
    { active: true, state: "Himachal Pradesh", id: "state10" },
    { active: true, state: "Jammu and Kashmir", id: "state11" },
    { active: true, state: "Jharkhand", id: "state28" },
    { active: true, state: "Karnataka", id: "state12" },
    { active: true, state: "Kerala", id: "state13" },
    { active: true, state: "Ladakh", id: "state14" },
    { active: true, state: "Madhya Pradesh", id: "state15" },
    { active: true, state: "Maharashtra", id: "state16" },
    { active: true, state: "Manipur", id: "state17" },
    { active: true, state: "Mizoram", id: "state18" },
    { active: true, state: "Orissa", id: "state19" },
    { active: true, state: "Puducherry", id: "state20" },
    { active: true, state: "Punjab", id: "state21" },
    { active: true, state: "Rajasthan", id: "state22" },
    { active: true, state: "Tamil Nadu", id: "state23" },
    { active: true, state: "Telangana", id: "state24" },
    { active: true, state: "Uttar Pradesh", id: "state25" },
    { active: true, state: "Uttaranchal", id: "state26" },
    { active: true, state: "West Bengal", id: "state27" },
    { active: false, state: "Meghalaya", id: "state29" },
    { active: false, state: "Nagaland", id: "state31" },
    { active: false, state: "Sikkim", id: "state33" },
    { active: false, state: "Tripura", id: "state34" },
];
function generateGraph( ) {
    let states = statesJSON;
    // states.sort( );
    var select = document.getElementById("stateDropDown"); 
    states.forEach( record => {
        if( record.state != "Overall" && record.active === true ) {
            var el = document.createElement( 'option' );
            el.textContent = record.state;
            el.value = record.state;
            el.setAttribute( 'id', record.id )
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
    
    generateTestingCenterCards( );
    var selectedStates = $('#stateDropDown').val( );

    var graphJson = [ ];
    Object.keys( map[ selectedStates ] ).forEach( date => {
        graphJson.push({ 
            "date": new Date( date ), 
            "state": selectedStates, 
            "Registered Cases": map[ selectedStates ][ date ][ "Cases Registered" ],
            "Recovered Cases": map[ selectedStates ][ date ][ "Cases Recovered" ],
            "Fatal Cases": map[ selectedStates ][ date ][ "Cases Fatal" ],
            "Active Cases": map[ selectedStates ][ date ][ "Cases Active" ],
        });
    } );

    var chart = c3.generate({
        bindto: '#chart',
        data: {
            json: graphJson,
            keys: {
                x: 'date', 
                value: ["Registered Cases",  "Active Cases", "Recovered Cases", "Fatal Cases" ],
            },
            colors: {
                "Registered Cases": '#000000',
                "Active Cases": '#3B5998',
                "Recovered Cases": '#188038',
                "Fatal Cases": '#d04c48'
            },
            names: {
                "Registered Cases": tr[ "total" ][ currentLanguage ],
                "Active Cases": tr[ "active" ][ currentLanguage ],
                "Recovered Cases": tr[ "cured" ][ currentLanguage ],
                "Fatal Cases": tr[ "death" ][ currentLanguage ],
            }
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
    
    let previousDay = new Date( lastDate - 1000*60*60*24 );
    document.getElementById('dashboardMeter-valueTotal').innerText = map[ selectedStates ][ parseDate( lastDate ) ][ "Cases Registered" ] ;
    let prevTotal = parseInt( map[ selectedStates ][ parseDate( lastDate ) ][ "Cases Registered" ] ) - parseInt( map[ selectedStates ][ parseDate( previousDay ) ][ "Cases Registered" ] );
    if( prevTotal > 0 ) {
        document.getElementById('dashboardMeter-valueTotalAnalysis').innerHTML = "+" + prevTotal + " <span style='color: black; font-size: smaller'>" + tr[ "yesterday" ][ currentLanguage ] + " </span>";
        document.getElementById('dashboardMeter-valueTotalAnalysis').style.color = "red";
    }
    else {
        document.getElementById('dashboardMeter-valueTotalAnalysis').innerHTML = prevTotal + " <span style='color: black; font-size: smaller'>" + tr[ "yesterday" ][ currentLanguage ] + " </span>";
        document.getElementById('dashboardMeter-valueTotalAnalysis').style.color = "green";
    }

    document.getElementById('dashboardMeter-valueActive').innerText = map[ selectedStates ][ parseDate( lastDate ) ][ "Cases Active" ] ;
    let prevActive = parseInt( map[ selectedStates ][ parseDate( lastDate ) ][ "Cases Active" ] ) - parseInt( map[ selectedStates ][ parseDate( previousDay ) ][ "Cases Active" ] );
    if( prevActive > 0 ) {
        document.getElementById('dashboardMeter-valueActiveAnalysis').innerHTML = "+" + prevActive + " <span style='color: black; font-size: smaller'>" + tr[ "yesterday" ][ currentLanguage ] + " </span>";
        document.getElementById('dashboardMeter-valueActiveAnalysis').style.color = "red";
    }
    else {
        document.getElementById('dashboardMeter-valueActiveAnalysis').innerHTML = prevActive + " <span style='color: black; font-size: smaller'>" + tr[ "yesterday" ][ currentLanguage ] + " </span>";
        document.getElementById('dashboardMeter-valueActiveAnalysis').style.color = "green";
    }

    document.getElementById('dashboardMeter-valueRecovered').innerText = map[ selectedStates ][ parseDate( lastDate ) ][ "Cases Recovered" ] ;
    let prevRecovered = parseInt( map[ selectedStates ][ parseDate( lastDate ) ][ "Cases Recovered" ] ) - parseInt( map[ selectedStates ][ parseDate( previousDay ) ][ "Cases Recovered" ] );
    if( prevRecovered > 0 ) {
        document.getElementById('dashboardMeter-valueRecoveredAnalysis').innerHTML = "+" + prevRecovered + " <span style='color: black; font-size: smaller'>" + tr[ "yesterday" ][ currentLanguage ] + " </span>";
        document.getElementById('dashboardMeter-valueRecoveredAnalysis').style.color = "green";
    }
    else {
        document.getElementById('dashboardMeter-valueRecoveredAnalysis').innerHTML = prevRecovered  + " <span style='color: black; font-size: smaller'>" + tr[ "yesterday" ][ currentLanguage ] + " </span>";
        document.getElementById('dashboardMeter-valueRecoveredAnalysis').style.color = "red";
    }
    
    document.getElementById('dashboardMeter-valueFatal').innerText = map[ selectedStates ][ parseDate( lastDate ) ][ "Cases Fatal" ] ;
    let prevFatal = parseInt( map[ selectedStates ][ parseDate( lastDate ) ][ "Cases Fatal" ] ) - parseInt( map[ selectedStates ][ parseDate( previousDay ) ][ "Cases Fatal" ] );
    if( prevFatal > 0 ) {
        document.getElementById('dashboardMeter-valueFatalAnalysis').innerHTML = "+" + prevFatal + " <span style='color: black; font-size: smaller'>" + tr[ "yesterday" ][ currentLanguage ] + " </span>";
        document.getElementById('dashboardMeter-valueFatalAnalysis').style.color = "red";
    }
    else {
        document.getElementById('dashboardMeter-valueFatalAnalysis').innerHTML = "+" + prevFatal + " <span style='color: black; font-size: smaller'>" + tr[ "yesterday" ][ currentLanguage ] + " </span>";
        document.getElementById('dashboardMeter-valueFatalAnalysis').style.display = "none";
    }
}

function testingCentersData( ) {
    const sheet_code = '1VTAuLT22gl5aZi3eMACO5mKkOIYxeM5ffW21_1OVymg';
    let myData = [ ];
    let myMap = { };
    let url = 'https://spreadsheets.google.com/feeds/cells/'+sheet_code+'/4/public/full?alt=json';
    $.getJSON(url, function(data) {
        myData[ "Testing Centers" ] = data.feed.entry;
        const dataRow = 2;
        const centerColumn = 1;
        let centerRowMap = { };
        data.feed.entry.forEach(spreadSheetCell => {
            if( parseInt( spreadSheetCell.gs$cell.col ) === centerColumn 
                    && parseInt( spreadSheetCell.gs$cell.row ) > dataRow ) {
                centerRowMap[ spreadSheetCell.gs$cell.row ] = spreadSheetCell.gs$cell.inputValue;
                myMap[ spreadSheetCell.gs$cell.inputValue ] = { }
            }
            if( parseInt( spreadSheetCell.gs$cell.col ) === 3 
                    && parseInt( spreadSheetCell.gs$cell.row ) > dataRow ) {
                myMap[ centerRowMap[ spreadSheetCell.gs$cell.row ] ][ "phone" ] = "+" + spreadSheetCell.gs$cell.inputValue;
            }
            if( parseInt( spreadSheetCell.gs$cell.col ) === 4 
                    && parseInt( spreadSheetCell.gs$cell.row ) > dataRow ) {
                myMap[ centerRowMap[ spreadSheetCell.gs$cell.row ] ][ "url" ] = spreadSheetCell.gs$cell.inputValue;
            }
            if( parseInt( spreadSheetCell.gs$cell.col ) === 5 
                    && parseInt( spreadSheetCell.gs$cell.row ) > dataRow ) {
                myMap[ centerRowMap[ spreadSheetCell.gs$cell.row ] ][ "website" ] = spreadSheetCell.gs$cell.inputValue;
            }
            if( parseInt( spreadSheetCell.gs$cell.col ) === 6
                    && parseInt( spreadSheetCell.gs$cell.row ) > dataRow ) {
                myMap[ centerRowMap[ spreadSheetCell.gs$cell.row ] ][ "location" ] = spreadSheetCell.gs$cell.inputValue;
            }
            if( parseInt( spreadSheetCell.gs$cell.col ) === 2 
                    && parseInt( spreadSheetCell.gs$cell.row ) > dataRow ) {
                let state = '';
                if( spreadSheetCell.gs$cell.inputValue === "Total Cases In India" ) {
                    state = "Overall";
                }
                else if( spreadSheetCell.gs$cell.inputValue === "Telengana" ) {
                    state = "Telangana";
                }
                else if( spreadSheetCell.gs$cell.inputValue === "Odisha" ) {
                    state = "Orissa";
                }
                else if( spreadSheetCell.gs$cell.inputValue === "Uttarakhand" ) {
                    state = "Uttaranchal";
                }
                else if( spreadSheetCell.gs$cell.inputValue === "Andaman and Nicobar Islands" ) {
                    state = "Andaman and Nicobar";
                }
                else { 
                    state = spreadSheetCell.gs$cell.inputValue;
                }
                myMap[ centerRowMap[ spreadSheetCell.gs$cell.row ] ][ "state" ] = state.trim();
            }
        });
        map[ "Testing Centers" ] = myMap;
        console.log( map );
    });
}

function generateTestingCenterCards( ) {
    var select = $('#stateDropDown').val( );
    let myData = [ ];
    let classDom = document.getElementById("testingCenters");   
    if( select != "Overall" ) {
        classDom.style.display = 'block';
        Object.keys( map[ "Testing Centers" ] ).forEach( center => {
            if( map[ "Testing Centers" ][ center ].state === select ) {
                myData.push({
                    "name": center,
                    "phone": map[ "Testing Centers" ][ center ].phone === undefined ? "Not Available" : map[ "Testing Centers" ][ center ].phone,
                    "url": map[ "Testing Centers" ][ center ].url === undefined ? "Not Available" : map[ "Testing Centers" ][ center ].url,
                    "website": map[ "Testing Centers" ][ center ].website === undefined ? "Not Available" : map[ "Testing Centers" ][ center ].website,
                    "location": map[ "Testing Centers" ][ center ].location === undefined ? "Not Available" : map[ "Testing Centers" ][ center ].location,
                    "state": map[ "Testing Centers" ][ center ].state === undefined ? "Not Available" : map[ "Testing Centers" ][ center ].state
                });
            }
        });
        
        var myDom = document.getElementById("testingCenter"); 
        if( myData.length > 0 ) {
            myDom.innerHTML = '';
            myData.forEach( record => {
                let bootstrapDom = document.createElement( 'div' );
                bootstrapDom.className = 'col-md-4';

                let recordDom = document.createElement( 'div' );
                recordDom.className = 'testingBox';

                let headerLabel = document.createElement( 'label' );
                headerLabel.className = 'testingBox-header';
                headerLabel.innerText = record.name;
                recordDom.appendChild( headerLabel );

                headerLabel = document.createElement( 'label' );
                headerLabel.className = 'testingBox-state';
                if( record.location != "Not Available" )
                    headerLabel.setAttribute( 'href', record.location );
                headerLabel.innerText = record.location;
                recordDom.appendChild( headerLabel );

                headerLabel = document.createElement( 'a' );
                headerLabel.className = 'testingBox-phone';
                if( record.phone != "Not Available" )
                    headerLabel.setAttribute( 'href', record.phone );
                headerLabel.setAttribute( 'href', 'tel:'+record.phone );
                headerLabel.innerText = record.phone;
                recordDom.appendChild( headerLabel );

                headerLabel = document.createElement( 'a' );
                headerLabel.className = 'testingBox-website';
                if( record.website != "Not Available" )
                    headerLabel.setAttribute( 'href', record.website );
                headerLabel.innerText = record.website;
                recordDom.appendChild( headerLabel );

                headerLabel = document.createElement( 'a' );
                headerLabel.className = 'testingBox-maps';
                if( record.url != "Not Available" )
                    headerLabel.setAttribute( 'href', record.url );
                headerLabel.setAttribute( 'href', record.url );
                headerLabel.innerText = record.url;
                recordDom.appendChild( headerLabel );

                bootstrapDom.appendChild( recordDom );
                myDom.appendChild( bootstrapDom );
            });
        }
        else {
            myDom.innerHTML = '<p> ' + tr[ "noTestingCenters" ][ currentLanguage ] + ' </p>';
        }
    } 
    else {
        classDom.style.display = 'none';
    }
}

/**  END OF FUNCTIONS  */