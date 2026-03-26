/**
 * Test predictive analytics endpoint
 */
const testPredict = async () => {
  try {
    // Note: You'll need a valid auth token. Get one from browser localStorage or cookie.
    const token = process.argv[2] || '';
    
    const response = await fetch('http://localhost:3000/analytics/predict', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      cache: 'no-store',
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log(`\n✅ Predictive analysis returned ${data.insights?.length || 0} insights`);
      if (data.meta) {
        console.log(`   Mode: ${data.meta.mode}`);
        console.log(`   Recent complaints: ${data.meta.recentComplaints}`);
        console.log(`   Geo points: ${data.meta.geoPoints}`);
        console.log(`   Clusters: ${data.meta.clusters}`);
      }
    } else {
      console.log(`\n❌ Error: ${data.message}`);
    }
  } catch (e) {
    console.error('Test failed:', e);
  }
};

testPredict();
