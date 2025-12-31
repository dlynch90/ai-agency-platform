const express = require('express');
const { exec } = require('child_process');

const app = express();
app.use(express.json());

app.post('/query', async (req, res) => {
    try {
        const { prompt } = req.body;
        exec(`ollama run llama2 "${prompt}"`, (error, stdout, stderr) => {
            if (error) {
                res.status(500).json({ error: error.message });
            } else {
                res.json({ response: stdout.trim() });
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3001, () => console.log('Ollama MCP Server running on port 3001'));
