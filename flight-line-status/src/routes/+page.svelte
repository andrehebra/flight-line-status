<script>
    import { Heading, P } from 'flowbite-svelte';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Checkbox, TableSearch } from 'flowbite-svelte';
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

        const interval = setInterval(() => {
            location.reload();
        }, 300000);

        // Cleanup the interval when the component is destroyed
        return () => clearInterval(interval);
    });


</script>
<div class="container">
<h1>FLIGHT LINE STATUS</h1>
<P>{getFormattedDate()} - Based on usage of runway {bestRunway}</P>

<div class="tableContainer">
<Table class="statusTable">
    <TableHead theadClass='text-xl uppercase'>
      <TableHeadCell>Flight Profile</TableHeadCell>
      <TableHeadCell>Conditions</TableHeadCell>
      <TableHeadCell>Status</TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
        <TableBodyRow>
            <TableBodyCell rowspan="4">DUAL</TableBodyCell>
            <TableBodyCell>Traffic Pattern</TableBodyCell>
            <TableBodyCell tdClass={dualTrafficPattern ? 'px-6 py-4 whitespace-nowrap font-medium bg-blue-500' : 'px-6 py-4 whitespace-nowrap font-medium bg-red-500'}>{dualTrafficPattern ? "OPEN" : "HOLD"}</TableBodyCell>
        </TableBodyRow>
        <TableBodyRow>
            <TableBodyCell>Practice Area</TableBodyCell>
            <TableBodyCell tdClass={dualPracticeArea ? 'px-6 py-4 whitespace-nowrap font-medium bg-blue-500' : 'px-6 py-4 whitespace-nowrap font-medium bg-red-500'}>{dualPracticeArea ? "OPEN" : "HOLD"}</TableBodyCell>
        </TableBodyRow>
        <TableBodyRow>
            <TableBodyCell>Cross Country</TableBodyCell>
            <TableBodyCell tdClass={dualCrossCountry ? 'px-6 py-4 whitespace-nowrap font-medium bg-blue-500' : 'px-6 py-4 whitespace-nowrap font-medium bg-red-500'}>{dualCrossCountry ? "OPEN" : "HOLD"}</TableBodyCell>
        </TableBodyRow>
        <TableBodyRow>
            <TableBodyCell>IFR</TableBodyCell>
            <TableBodyCell tdClass={dualIFR ? 'px-6 py-4 whitespace-nowrap font-medium bg-blue-500' : 'px-6 py-4 whitespace-nowrap font-medium bg-red-500'}>{dualIFR ? "OPEN" : "HOLD"}</TableBodyCell>
        </TableBodyRow>
    </TableBody>
    <Hr classHr='my-0'></Hr>
    <TableBody tableBodyClass="divide-y">
        <TableBodyRow>
            <TableBodyCell rowspan="4">SOLO</TableBodyCell>
            <TableBodyCell>Traffic Pattern</TableBodyCell>
            <TableBodyCell tdClass={soloTrafficPattern ? 'px-6 py-4 whitespace-nowrap font-medium bg-blue-500' : 'px-6 py-4 whitespace-nowrap font-medium bg-red-500'}>{soloTrafficPattern ? "OPEN" : "HOLD"}</TableBodyCell>
        </TableBodyRow>
        <TableBodyRow>
            <TableBodyCell>Practice Area</TableBodyCell>
            <TableBodyCell tdClass={soloPracticeArea ? 'px-6 py-4 whitespace-nowrap font-medium bg-blue-500' : 'px-6 py-4 whitespace-nowrap font-medium bg-red-500'}>{soloPracticeArea ? "OPEN" : "HOLD"}</TableBodyCell>
        </TableBodyRow>
        <TableBodyRow>
            <TableBodyCell>Cross Country</TableBodyCell>
            <TableBodyCell tdClass={soloCrossCountry ? 'px-6 py-4 whitespace-nowrap font-medium bg-blue-500' : 'px-6 py-4 whitespace-nowrap font-medium bg-red-500'}>{soloCrossCountry ? "OPEN" : "HOLD"}</TableBodyCell>
        </TableBodyRow>
    </TableBody>
    <Hr classHr='my-0'></Hr>
    <TableBody tableBodyClass="divide-y">
        <TableBodyRow>
            <TableBodyCell rowspan="4">RENTER</TableBodyCell>
            <TableBodyCell>Traffic Pattern</TableBodyCell>
            <TableBodyCell tdClass={renterTrafficPattern ? 'px-6 py-4 whitespace-nowrap font-medium bg-blue-500' : 'px-6 py-4 whitespace-nowrap font-medium bg-red-500'}>{renterTrafficPattern ? "OPEN" : "HOLD"}</TableBodyCell>
        </TableBodyRow>
        <TableBodyRow>
            <TableBodyCell>Practice Area</TableBodyCell>
            <TableBodyCell tdClass={renterPracticeArea ? 'px-6 py-4 whitespace-nowrap font-medium bg-blue-500' : 'px-6 py-4 whitespace-nowrap font-medium bg-red-500'}>{renterPracticeArea ? "OPEN" : "HOLD"}</TableBodyCell>
        </TableBodyRow>
        <TableBodyRow>
            <TableBodyCell>Cross Country</TableBodyCell>
            <TableBodyCell tdClass={renterCrossCountry ? 'px-6 py-4 whitespace-nowrap font-medium bg-blue-500' : 'px-6 py-4 whitespace-nowrap font-medium bg-red-500'}>{renterCrossCountry ? "OPEN" : "HOLD"}</TableBodyCell>
        </TableBodyRow>
        
    </TableBody>
    <Hr classHr='my-0'></Hr>
    <TableBody tableBodyClass="divide-y">
        <TableBodyRow>
            <TableBodyCell rowspan="4">TIME BUILD</TableBodyCell>
            <TableBodyCell>Traffic Pattern</TableBodyCell>
            <TableBodyCell tdClass={timeBuildTrafficPattern ? 'px-6 py-4 whitespace-nowrap font-medium bg-blue-500' : 'px-6 py-4 whitespace-nowrap font-medium bg-red-500'}>{timeBuildTrafficPattern ? "OPEN" : "HOLD"}</TableBodyCell>
        </TableBodyRow>
        <TableBodyRow>
            <TableBodyCell>Practice Area</TableBodyCell>
            <TableBodyCell tdClass={timeBuildPracticeArea ? 'px-6 py-4 whitespace-nowrap font-medium bg-blue-500' : 'px-6 py-4 whitespace-nowrap font-medium bg-red-500'}>{timeBuildPracticeArea ? "OPEN" : "HOLD"}</TableBodyCell>
        </TableBodyRow>
        <TableBodyRow>
            <TableBodyCell>Cross Country</TableBodyCell>
            <TableBodyCell tdClass={timeBuildCrossCountry ? 'px-6 py-4 whitespace-nowrap font-medium bg-blue-500' : 'px-6 py-4 whitespace-nowrap font-medium bg-red-500'}>{timeBuildCrossCountry ? "OPEN" : "HOLD"}</TableBodyCell>
        </TableBodyRow>
        
    </TableBody>
    
  </Table>
</div>
</div>

<style>
    :global(html) {
        background-color: white;
    }
    :global(.statusTable) {
        width: 100%;
    }

    :global(.tableContainer) {
        padding-top: 10px;
        width: 98vw;
    }
    :global(P) {
        color: #39488e;
        font-size: 2rem;
    }

    :global(h1) {
        color: #39488e;
        font-weight: bold;
        font-size: 4rem;
    }

    :global(.container) {
        padding-left: 2vw;
    }

    
</style>