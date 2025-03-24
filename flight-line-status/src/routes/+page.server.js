// src/routes/+page.server.js

//import fetch from 'node-fetch';

export async function load() {
  let apiUrl = 'https://aviationweather.gov/api/data/metar?ids=KORL&format=json&taf=false&hours=3';

  try {
    // Fetch the METAR data from the API
    let response = await fetch(apiUrl);

    if (!response.ok) {
      // If the response isn't OK, return an error
      return {
        status: response.status,
        body: { message: 'Failed to fetch METAR data' },
      };
    }

    // Parse the response as JSON
    const metar = await response.json();

    // Fetch the TAF data from the API
    apiUrl = "https://aviationweather.gov/api/data/taf?ids=KMCO&format=json&metar=false";
    response = await fetch(apiUrl);

    if (!response.ok) {
      // If the response isn't OK, return an error
      return {
        status: response.status,
        body: { message: 'Failed to fetch METAR data' },
      };
    }

    // Parse the response as JSON
    const taf = await response.json();

    // Return the data as props for the Svelte component
    return {data: [metar, taf]};
  } catch (error) {
    console.error('Error fetching METAR data:', error);
    return {
      status: 500,
      body: { message: 'Internal server error' },
    };
  }
}
