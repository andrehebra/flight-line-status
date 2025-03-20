<script>
    import { Heading, P } from 'flowbite-svelte';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Checkbox, TableSearch } from 'flowbite-svelte';

    // variables to indicate whether or not flights are allowed: false = no go, true = go
    let dualTrafficPattern = false;
    let dualPracticeArea = false;
    let dualCrossCountry = false;
    let dualIFR = false;

    let soloTrafficPattern = false;
    let soloPracticeArea = false;
    let soloCrossCountry = false;
    let soloIFR = false;

    let renterTrafficPattern = false;
    let renterPracticeArea = false;
    let renterCrossCountry = false;
    let renterIFR = false;

    let timeBuildTrafficPattern = false;
    let timeBuildPracticeArea = false;
    let timeBuildCrossCountry = false;
    let timeBuildIFR = false;

    let metarReports = [];

  // Define an async function to fetch data from the API
  async function fetchMetarData() {
    const url = 'https://aviationweather.gov/api/data/metar?ids=KORL&format=json&taf=false&hours=3';

    try {
      // Fetch the data from the API
      const response = await fetch(url);

      // Check if the response is successful
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Parse the JSON data
      const data = await response.json();
      metarReports = data; // Store the fetched data in metarReports array
      console.log(metarReports)
    } catch (error) {
      console.error('Error fetching METAR data:', error);
    }
  }

    // Fetch the data when the component is mounted
    import { onMount } from 'svelte';

    onMount(() => {
    fetchMetarData();
    });

</script>

<Heading tag="h1" class="mb-4" customSize="text-4xl font-extrabold  md:text-5xl lg:text-6xl">FLIGHT LINE STATUS</Heading>
<P>DATE / TIME LAST UPDATED</P>

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
        <TableBodyRow>
            <TableBodyCell>IFR</TableBodyCell>
            <TableBodyCell>{soloIFR ? "GO" : "NO-GO"}</TableBodyCell>
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
        <TableBodyRow>
            <TableBodyCell>IFR</TableBodyCell>
            <TableBodyCell>{renterIFR ? "GO" : "NO-GO"}</TableBodyCell>
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
        <TableBodyRow>
            <TableBodyCell>IFR</TableBodyCell>
            <TableBodyCell>{timeBuildIFR ? "GO" : "NO-GO"}</TableBodyCell>
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