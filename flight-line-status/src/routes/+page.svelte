<script>
    import { Heading, P } from 'flowbite-svelte';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Checkbox, TableSearch } from 'flowbite-svelte';
    import { onMount } from 'svelte';

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

    let bestRunway = 0;
    let crossWindComponent = 0;
    let headWindComponent = 0;

    function calculateRunwayWindComponents(windDirection, windSpeed) {
    // Runway headings in degrees
    const runways = {
        7: 70,
        25: 250,
        13: 130,
        31: 310
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

    
    function calculateHolds(metar) {
        metar = metar.data[0];

        console.log(metar)
        
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

        console.log("best runway: " + bestRunway);
        console.log("crosswind component: " + crossWindComponent);
        console.log("headwind component: " + headWindComponent);

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
        console.log(visibility);

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
        if (lowestCeiling < 740) {
            dualIFR = false;
        }
        
    }

    onMount(() => {
        if (data) {
            calculateHolds(data);
        } else {
            console.log('Data is not available');
        }
    });


</script>

<Heading tag="h1" class="mb-4" customSize="text-4xl font-extrabold  md:text-5xl lg:text-6xl">FLIGHT LINE STATUS</Heading>
<P>DATE / TIME LAST UPDATED</P>
<P>NUMBERS BASED ON RUNWAY {bestRunway}</P>

<div class="tableContainer">
<Table class="statusTable">
    <TableHead>
      <TableHeadCell>Flight Profile</TableHeadCell>
      <TableHeadCell>Conditions</TableHeadCell>
      <TableHeadCell>Status</TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
        <TableBodyRow>
            <TableBodyCell rowspan="4">DUAL</TableBodyCell>
            <TableBodyCell>Traffic Pattern</TableBodyCell>
            <TableBodyCell>{dualTrafficPattern ? "GO" : "NO-GO"}</TableBodyCell>
        </TableBodyRow>
        <TableBodyRow>
            <TableBodyCell>Practice Area</TableBodyCell>
            <TableBodyCell>{dualPracticeArea ? "GO" : "NO-GO"}</TableBodyCell>
        </TableBodyRow>
        <TableBodyRow>
            <TableBodyCell>Cross Country</TableBodyCell>
            <TableBodyCell>{dualCrossCountry ? "GO" : "NO-GO"}</TableBodyCell>
        </TableBodyRow>
        <TableBodyRow>
            <TableBodyCell>IFR</TableBodyCell>
            <TableBodyCell>{dualIFR ? "GO" : "NO-GO"}</TableBodyCell>
        </TableBodyRow>
    </TableBody>
    <TableBody tableBodyClass="divide-y">
        <TableBodyRow>
            <TableBodyCell rowspan="4">SOLO</TableBodyCell>
            <TableBodyCell>Traffic Pattern</TableBodyCell>
            <TableBodyCell>{soloTrafficPattern ? "GO" : "NO-GO"}</TableBodyCell>
        </TableBodyRow>
        <TableBodyRow>
            <TableBodyCell>Practice Area</TableBodyCell>
            <TableBodyCell>{soloPracticeArea ? "GO" : "NO-GO"}</TableBodyCell>
        </TableBodyRow>
        <TableBodyRow>
            <TableBodyCell>Cross Country</TableBodyCell>
            <TableBodyCell>{soloCrossCountry ? "GO" : "NO-GO"}</TableBodyCell>
        </TableBodyRow>
    </TableBody>
    <TableBody tableBodyClass="divide-y">
        <TableBodyRow>
            <TableBodyCell rowspan="4">RENTER</TableBodyCell>
            <TableBodyCell>Traffic Pattern</TableBodyCell>
            <TableBodyCell>{renterTrafficPattern ? "GO" : "NO-GO"}</TableBodyCell>
        </TableBodyRow>
        <TableBodyRow>
            <TableBodyCell>Practice Area</TableBodyCell>
            <TableBodyCell>{renterPracticeArea ? "GO" : "NO-GO"}</TableBodyCell>
        </TableBodyRow>
        <TableBodyRow>
            <TableBodyCell>Cross Country</TableBodyCell>
            <TableBodyCell>{renterCrossCountry ? "GO" : "NO-GO"}</TableBodyCell>
        </TableBodyRow>
        
    </TableBody>
    <TableBody tableBodyClass="divide-y">
        <TableBodyRow>
            <TableBodyCell rowspan="4">TIME BUILD</TableBodyCell>
            <TableBodyCell>Traffic Pattern</TableBodyCell>
            <TableBodyCell>{timeBuildTrafficPattern ? "GO" : "NO-GO"}</TableBodyCell>
        </TableBodyRow>
        <TableBodyRow>
            <TableBodyCell>Practice Area</TableBodyCell>
            <TableBodyCell>{timeBuildPracticeArea ? "GO" : "NO-GO"}</TableBodyCell>
        </TableBodyRow>
        <TableBodyRow>
            <TableBodyCell>Cross Country</TableBodyCell>
            <TableBodyCell>{timeBuildCrossCountry ? "GO" : "NO-GO"}</TableBodyCell>
        </TableBodyRow>
        
    </TableBody>
    
  </Table>
</div>

<style>
    :global(.statusTable) {
        width: 100%;
        border: 1px solid #ccc;
    }

    :global(.tableContainer) {
        padding: 25px;
    }

    :global(TableBodyCell) {
        text-align: center;
    }
</style>