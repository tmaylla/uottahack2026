const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');

// Allow your Chrome Extension to talk to this server
fastify.register(cors, { 
  origin: "*" 
});

fastify.post('/api/analyze', async (request, reply) => {
  const { text } = request.body;

  if (!text) {
    return reply.status(400).send({ error: "No text provided" });
  }

  const prompt = `Analyze this text for scams or phishing. 
  Return ONLY a JSON object: {"result": "safe" | "suspicious" | "scam", "confidence": 0-100, "analysis": "short explanation"}. 
  Text: ${text}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    
    // Extract the text content from Gemini's response
    let aiText = data.candidates[0].content.parts[0].text;
    
    // Clean up any markdown code blocks Gemini might add
    aiText = aiText.replace(/```json|```/g, "").trim();
    
    return JSON.parse(aiText);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: "AI Analysis failed" });
  }
});

// Start the server
const start = async () => {
  try {
    // Render uses the PORT environment variable; default to 3000 for local testing
    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();