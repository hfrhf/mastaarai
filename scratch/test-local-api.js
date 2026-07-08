console.log("Testing local API endpoint for Gemini...");
const startTime = Date.now();

fetch('http://localhost:5000/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'google/gemini-3.5-flash',
    messages: [
      { role: 'user', content: 'Hello' }
    ],
    stream: true
  })
})
.then(async res => {
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`HTTP Status: ${res.status} ${res.statusText} in ${duration}s`);
  if (!res.ok) {
    const text = await res.text();
    console.error('Error Body:', text);
  } else {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    
    function read() {
      reader.read().then(({ done, value }) => {
        if (done) {
          console.log("\nStream done");
          return;
        }
        console.log("CHUNK:", decoder.decode(value));
        read();
      });
    }
    read();
  }
})
.catch(err => {
  console.error('Fetch Error:', err);
});
