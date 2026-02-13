export default async function handler(req, res) {
  // 1. Extract the endpoint and other parameters (like page, query) from the URL
  const { endpoint, ...params } = req.query;

  // 2. Get your API Key securely from Vercel's settings
  const apiKey = process.env.TMDB_API_KEY; 
  const baseUrl = "https://api.themoviedb.org/3";

  if (!endpoint) {
    return res.status(400).json({ error: "Endpoint is required" });
  }

  // 3. Clean up the endpoint (remove leading slash if present)
  // e.g., "/movie/popular" becomes "movie/popular"
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // 4. Construct the query string manually to ensure it's clean
  // We explicitly add the api_key here.
  const queryParams = new URLSearchParams({
    api_key: apiKey,
    language: 'en-US', // Default language
    ...params // Adds 'page', 'query', etc.
  });

  const finalUrl = `${baseUrl}/${cleanEndpoint}?${queryParams.toString()}`;

  try {
    const response = await fetch(finalUrl);
    const data = await response.json();

    // 5. Add CORS headers so your website (the frontend) is allowed to read this data
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch from TMDB", details: error.message });
  }
}