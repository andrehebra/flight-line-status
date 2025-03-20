// src/routes/+page.server.js

//import fetch from 'node-fetch';

export async function load() {
  const apiUrl = 'https://aviationweather.gov/api/data/metar?ids=KRKD&format=json&taf=false&hours=3';

  try {
    // Fetch the METAR data from the API
    const response = await fetch(apiUrl);

    if (!response.ok) {
      // If the response isn't OK, return an error
      return {
        status: response.status,
        body: { message: 'Failed to fetch METAR data' },
      };
    }

    // Parse the response as JSON
    const data = await response.json();

    // Return the data as props for the Svelte component
    return { data
    };
  } catch (error) {
    console.error('Error fetching METAR data:', error);
    return {
      status: 500,
      body: { message: 'Internal server error' },
    };
  }
}
