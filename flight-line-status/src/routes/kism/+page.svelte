<script>
    import { Heading, P } from 'flowbite-svelte';
    import { Checkbox, TableSearch } from 'flowbite-svelte';
    import { onMount } from 'svelte';
    import { Hr } from 'flowbite-svelte'

    //return a readable date
    function getFormattedDate() {
        const now = new Date();

        // Array of weekday names
        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        // Array of month names
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        // Get the weekday, month, day, hour, and minute
        const weekday = weekdays[now.getDay()];
        const month = months[now.getMonth()];
        const day = now.getDate();
        const hour = now.getHours();
        const minute = now.getMinutes();

        // Format time in 12-hour format with AM/PM
        const period = hour >= 12 ? "pm" : "am";
        const formattedHour = hour % 12 || 12; // Converts 24-hour time to 12-hour time (e.g., 0 -> 12, 13 -> 1)
        const formattedMinute = minute < 10 ? `0${minute}` : minute; // Add leading zero for single digits

        // Return the final formatted string
        return `${weekday}, ${month} ${day} at ${formattedHour}:${formattedMinute}${period}`;
    }

    let metarAirport = '';
    let rawMetar = '';
    let metarTime = '';

    // determine if gusts are reported on the TAF
    let gustsReportedTaf = false;

    // variables to indicate whether or not flights are allowed: false = no go, true = go
    let dualTrafficPattern = true;
    let dualPracticeArea = true;
    let dualCrossCountry = true;
    let dualIFR = true;

    let soloTrafficPattern = true;
    let soloPracticeArea = true;
    let soloCrossCountry = true;

    let renterTrafficPattern = true;
    let renterPracticeArea = true;
    let renterCrossCountry = true;
    let renterIFR = true;

    let timeBuildTrafficPattern = true;
    let timeBuildPracticeArea = true;
    let timeBuildCrossCountry = true;
    let timeBuildIFR = true;

    export let data;
    const { metarReports } = data;

    //console.log(data);

    let bestRunway = 0;
    let crossWindComponent = 0;
    let headWindComponent = 0;

    function isPointInsidePolygon(testPoint, polygonCoords) {
    const x = testPoint.lon;
    const y = testPoint.lat;
    let inside = false;

    for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
        const xi = polygonCoords[i].lon, yi = polygonCoords[i].lat;
        const xj = polygonCoords[j].lon, yj = polygonCoords[j].lat;

        const intersect = ((yi > y) !== (yj > y)) &&
                        (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
    }

    let insideSIGMET = false;

    function determineRelevantSigmet(sigmetArray) {
        console.log(sigmetArray)

        const currentTimeStamp = Date.now();

        for (let i = 0; i < sigmetArray.length; i++) {
            if (sigmetArray[i].hazard == "CONVECTIVE") {
                //console.log(sigmetArray[i])
                if (isPointInsidePolygon({lat: 28.55, lon: -81.33},sigmetArray[i].coords)) {
                    if (currentTimeStamp >= sigmetArray[i].validTimeFrom * 1000 && currentTimeStamp <= sigmetArray[i].validTimeTo * 1000) {
                        console.log(i)
                        if (sigmetArray[i].severity > 0) {
                            insideSIGMET = true;
                        }
                    }
                }
            }
        }

        if (insideSIGMET) {
            dualTrafficPattern = false;
            dualPracticeArea = false;
            dualCrossCountry = false;
            dualIFR = false;
            soloTrafficPattern = false;
            soloPracticeArea = false;
            soloCrossCountry = false;          
            renterTrafficPattern = false;
            renterPracticeArea = false;
            renterCrossCountry = false;
            renterIFR = false;
            timeBuildTrafficPattern = false;
            timeBuildPracticeArea = false;
            timeBuildCrossCountry = false;
            timeBuildIFR = false;    
        
        }
    }

    function calculateRunwayWindComponents(windDirection, windSpeed) {
        // Runway headings in degrees
        const runways = {
            7: 67,
            25: 247,
            13: 131,
            31: 311,
        };

        bestRunway = null;
        let bestHeadwind = -Infinity;
        let bestCrosswind = 0;

        // Function to calculate the angle between wind direction and runway heading
        function calculateAngleDifference(windDirection, runwayHeading) {
            let angle = Math.abs(windDirection - runwayHeading);
            if (angle > 180) {
                angle = 360 - angle;
            }
            return angle;
        }

        // Loop through each runway to calculate the headwind and crosswind components
        for (let runway in runways) {
            const runwayHeading = runways[runway];
            const angle = calculateAngleDifference(windDirection, runwayHeading);

            // Calculate headwind component (wind aligned with runway)
            const headwindComponent = windSpeed * Math.cos((angle * Math.PI) / 180);
            // Calculate crosswind component (wind perpendicular to runway)
            const crosswindComponent = windSpeed * Math.sin((angle * Math.PI) / 180);

            // Update the best runway if the current runway has a higher headwind component
            if (headwindComponent > bestHeadwind) {
            bestRunway = runway;
            bestHeadwind = headwindComponent;
            bestCrosswind = crosswindComponent;
            }
        }

        headWindComponent = bestHeadwind;
        crossWindComponent = bestCrosswind;
    }

    function calculateGusts(taf) {
        //console.log(taf);
        let currentTaf = taf[0].fcsts;
        //console.log(currentTaf);

        const currentTimestamp = Date.now();
        const futureTimestamp = currentTimestamp + 1 * 60 * 60 * 1000; //8 hours into the future
         //console.log(currentTimestamp);
         //console.log(futureTimestamp);

        for (let i = 0; i < currentTaf.length; i++) {
            if (futureTimestamp >= currentTaf[i].timeFrom * 1000 && currentTimestamp <= currentTaf[i].timeTo * 1000) {
                if (currentTaf[i].wgst) {
                    gustsReportedTaf = true;
                }   
            }
            
        }
    }

    function formatTime(dateString) {
        // Parse the date string to a Date object
        const date = new Date(dateString);

        // Extract the hours and minutes
        const hours = date.getHours().toString().padStart(2, '0'); // Pad single digit hours with leading zero
        const minutes = date.getMinutes().toString().padStart(2, '0'); // Pad single digit minutes with leading zero

        // Return the formatted string in "HH:MM" format
        return `${hours}:${minutes}`;
    }
    
    function calculateHolds(metar) {
        console.log(metar)
        let KORLexists = false;
        for (let i = 0; i < metar.length; i++) {
            if (metar[i].icaoId == "KISM") {
                KORLexists = true;
                metar = metar[i]
            }
        }
        if (KORLexists == false) {
            metar = metar[0];
        }

        console.log(metar.rawOb);
        rawMetar = metar.rawOb;

        metarAirport = metar.icaoId;
        metarTime = formatTime(metar.receiptTime);
        
        // get the wind speed and direction including gusts if reported
        let windSpeed = metar.wspd;
        let windDirection = metar.wdir;
        let windGust = 0;
        if (metar.wgst == null || metar.wgst <= metar.wspd) {
            windGust = metar.wspd;
        } else {
            windGust = metar.wgst;
        }

        //check if gusts are 30 knots or above and make no go for ALL FLIGHTS
        if (windGust >= 30) {
            dualTrafficPattern = false;
            dualPracticeArea = false;
            dualCrossCountry = false;
            dualIFR = false;
            soloTrafficPattern = false;
            soloPracticeArea = false;
            soloCrossCountry = false;          
            renterTrafficPattern = false;
            renterPracticeArea = false;
            renterCrossCountry = false;
            renterIFR = false;
            timeBuildTrafficPattern = false;
            timeBuildPracticeArea = false;
            timeBuildCrossCountry = false;
            timeBuildIFR = false;    
        }

        // check if any gusts reported for student solo flights
        if (windGust > windSpeed) {
            soloTrafficPattern = false;
            soloPracticeArea = false;
            soloCrossCountry = false;
        }

        // check if gusts reported on taf in future period
        if (gustsReportedTaf) {
            soloCrossCountry = false;
            soloPracticeArea = false;
            soloTrafficPattern = false;
        }

        // check if total wind is greater than 25
        if (windGust > 25 || windSpeed > 25) {
            dualTrafficPattern = false;
            dualPracticeArea = false;
            dualCrossCountry = false;
            dualIFR = false;
            renterTrafficPattern = false;
            renterPracticeArea = false;
            renterCrossCountry = false;
            renterIFR = false;
            timeBuildTrafficPattern = false;
            timeBuildPracticeArea = false;
            timeBuildCrossCountry = false;
            timeBuildIFR = false; 
        }

        //check if total wind is greater than 20 for student solos
        if (windGust > 20 || windSpeed > 20) {
            soloTrafficPattern = false;
            soloPracticeArea = false;
            soloCrossCountry = false;
        }

        //calculate the headwind / crosswind components as well as the best runway to be used
        calculateRunwayWindComponents(windDirection, windGust);

        //console.log("best runway: " + bestRunway);
        //console.log("crosswind component: " + crossWindComponent);
        //console.log("headwind component: " + headWindComponent);

        //remove flights if crosswind greater than 15 knots
        if (crossWindComponent > 15) {
            dualTrafficPattern = false;
            dualPracticeArea = false;
            dualCrossCountry = false;
            dualIFR = false;
            renterTrafficPattern = false;
            renterPracticeArea = false;
            renterCrossCountry = false;
            renterIFR = false;
            timeBuildTrafficPattern = false;
            timeBuildPracticeArea = false;
            timeBuildCrossCountry = false;
            timeBuildIFR = false; 
        }

        //remove solo flights if crosswind greater than 10 knots
        if (crossWindComponent > 10) {
            soloTrafficPattern = false;
            soloPracticeArea = false;
            soloCrossCountry = false;
        }

        //get the visibility
        let visibility = parseFloat(metar.visib);
        //console.log(visibility);

        //check if vis is less than 1sm to remove traffic pattern flights
        if (visibility < 1) {
            dualIFR = false;
        }

        //check if vis is less than 3sm to remove traffic pattern flights
        if (visibility < 3) {
            dualTrafficPattern = false;
            soloTrafficPattern = false;
            renterTrafficPattern = false;
            timeBuildTrafficPattern = false;
        }

        //check if vis is less than 5sm for the practice area
        if (visibility < 5) {
            dualPracticeArea = false;
            soloPracticeArea = false;
            renterPracticeArea = false;
            timeBuildPracticeArea = false;
        }

        // check if vis is less than 6sm for cross country
        if (visibility < 6) {
            dualCrossCountry = false;
            soloCrossCountry = false;
            renterCrossCountry = false;
            timeBuildCrossCountry = false;
        }

        //get the ceiling
        let lowestCeiling = 100000;
        for (let i = 0; i < metar.clouds.length; i++) {
            if (metar.clouds[i].cover == "BKN" || metar.clouds[i].cover == "OVC") {
                if (metar.clouds[i].base <= lowestCeiling) {
                    lowestCeiling = metar.clouds[i].base;
                }
            }
        }

        // check if ceiling below 1600
        if (lowestCeiling < 1600) {
            dualTrafficPattern = false;
            soloTrafficPattern = false;
            renterTrafficPattern = false;
            timeBuildTrafficPattern = false;
        }

        // check if ceiling below 2000
        if (lowestCeiling < 2000) {
            dualPracticeArea = false;
            soloPracticeArea = false;
            renterPracticeArea = false;
            timeBuildPracticeArea = false;
            dualCrossCountry = false;
            timeBuildCrossCountry = false;
        }

        // check if ceiling below 4000
        if (lowestCeiling < 4000) {
            soloCrossCountry = false;
        }

        // check if ceiling below 3000
        if (lowestCeiling < 3000) {
            renterCrossCountry = false;
        }

        //check if ceiling below 740
        if (lowestCeiling < 467) {
            dualIFR = false;
        }
        
    }

    onMount(() => {
        if (data) {
            calculateGusts(data.data[1]);
            calculateHolds(data.data[0]);
            determineRelevantSigmet(data.data[2]);
        } else {
            console.log('Data is not available');
        }

        const interval = setInterval(() => {
            location.reload();
        }, 300000);

        // Cleanup the interval when the component is destroyed
        return () => clearInterval(interval);
    });


</script>
<div class="horiz">
    <div class="blank"></div>
    
<div class="container">
    <h1>FLIGHT LINE STATUS</h1>
    <div class="horizontal">
        <P>{getFormattedDate()} - Based on usage of runway {bestRunway}</P>
        <P>-</P>
        <P id={gustsReportedTaf ? "gusts" : ""}>{gustsReportedTaf == true ? "Gusts reported on ISM TAF within the next hour" : "No gusts reported on MCO TAF within the next hour"}</P>
    </div>
    <P>{rawMetar}</P>
    {#if insideSIGMET}<P id={insideSIGMET ? "gusts" : ""}>Convective SIGMET Active</P>{/if}
    
    <div class="heightbox"></div>
    
    <div class="tableContainer">
    <table class="statusTable">
        
        <thead theadClass='text-xl uppercase'>
            <tr>
                <th>FLIGHT PROFILE</th>
                <th>CONDITIONS</th>
                <th>STATUS</th>
            </tr>
        </thead>
        
        <tbody tableBodyClass="divide-y">
            <tr>
                <td rowspan="4">DUAL</td>
                <td>TRAFFIC PATTERN</td>
                <td class={dualTrafficPattern ? 'line-open' : 'line-hold'}>{dualTrafficPattern ? "OPEN" : "HOLD"}</td>
            </tr>
            <tr>
                <td>PRACTICE AREA</td>
                <td class={dualPracticeArea ? 'line-open' : 'line-hold'}>{dualPracticeArea ? "OPEN" : "HOLD"}</td>
            </tr>
            <tr>
                <td>CROSS COUNTRY</td>
                <td class={dualCrossCountry ? 'line-open' : 'line-hold'}>{dualCrossCountry ? "OPEN" : "HOLD"}</td>
            </tr>
            <tr>
                <td>IFR</td>
                <td class={dualIFR ? 'line-open' : 'line-hold'}>{dualIFR ? "OPEN" : "HOLD"}</td>
            </tr>
        </tbody>
        <tbody tableBodyClass="divide-y">
            <tr>
                <td rowspan="4">SOLO</td>
                <td>TRAFFIC PATTERN</td>
                <td class={soloTrafficPattern ? 'line-open' : 'line-hold'}>{soloTrafficPattern ? "OPEN" : "HOLD"}</td>
            </tr>
            <tr>
                <td>PRACTICE AREA</td>
                <td class={soloPracticeArea ? 'line-open' : 'line-hold'}>{soloPracticeArea ? "OPEN" : "HOLD"}</td>
            </tr>
            <tr>
                <td>CROSS COUNTRY</td>
                <td class={soloCrossCountry ? 'line-open' : 'line-hold'}>{soloCrossCountry ? "OPEN" : "HOLD"}</td>
            </tr>
        </tbody>
        <tbody tableBodyClass="divide-y">
            <tr>
                <td rowspan="4">RENTER</td>
                <td>TRAFFIC PATTERN</td>
                <td class={renterTrafficPattern ? 'line-open' : 'line-hold'}>{renterTrafficPattern ? "OPEN" : "HOLD"}</td>
            </tr>
            <tr>
                <td>PRACTICE AREA</td>
                <td class={renterPracticeArea ? 'line-open' : 'line-hold'}>{renterPracticeArea ? "OPEN" : "HOLD"}</td>
            </tr>
            <tr>
                <td>CROSS COUNTRY</td>
                <td class={renterCrossCountry ? 'line-open' : 'line-hold'}>{renterCrossCountry ? "OPEN" : "HOLD"}</td>
            </tr>
            
        </tbody>
        <tbody tableBodyClass="divide-y">
            <tr>
                <td rowspan="4">TIME BUILD</td>
                <td>TRAFFIC PATTERN</td>
                <td class={timeBuildTrafficPattern ? 'line-open' : 'line-hold'}>{timeBuildTrafficPattern ? "OPEN" : "HOLD"}</td>
            </tr>
            <tr>
                <td>PRACTICE AREA</td>
                <td class={timeBuildPracticeArea ? 'line-open' : 'line-hold'}>{timeBuildPracticeArea ? "OPEN" : "HOLD"}</td>
            </tr>
            <tr>
                <td>CROSS COUNTRY</td>
                <td class={timeBuildCrossCountry ? 'line-open' : 'line-hold'}>{timeBuildCrossCountry ? "OPEN" : "HOLD"}</td>
            </tr>
            
        </tbody>
        
    </table>
    </div>
    </div>
    
    <div class="blank"></div>
</div>


<style>
    :global(html, body) {
        margin: 0;
        padding: 0;
        height: 100vh;
        width: 100vw;
    }

    :global(.horiz) {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        margin-left: 30px;
        margin-right: 30px;
    }

    :global(.heightbox) {
        height: 10px;
        width: 100vw;
    }

    :global(th) {
        padding-left: 10px;
    }

    :global(.line-open) {
        background-color: rgb(17, 221, 17);
    }

    :global(.line-hold) {
        background-color: red;
    }


    :global(.statusTable) {
        width: 100%
    }

    :global(.horizontal) {
        display: flex;
        flex-direction: row;
        gap: 5px;
    }

    :global(thead) {
        background-color: #39488e;
        color: white;
        text-align: left;
        font-size: 30px;
    }

    :global(td) {
        font-size: 20px;
        border: 1px solid #dddddd;
        height: 37px;
        padding-left: 10px;
    }

    :global(.tableContainer) {
        width: 100%;
    }
    :global(P) {
        color: #39488e;
        font-size: 1.3rem;
    }

    :global(h1) {
        color: #39488e;
        font-weight: bold;
        font-size: 4rem;
    }

    :global(.container) {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%; /* Full width of the viewport */
        height: 100vh; /* Full height of the viewport */
        margin: 0;
        padding: 0;
    }

    :global(#gusts) {
        color: red;
    }

    
</style>