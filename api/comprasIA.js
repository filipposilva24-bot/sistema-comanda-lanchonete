module.exports = async (req, res) => {
    // Configura CORS básico se necessário
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY não configurada na Vercel.' });
    }

    try {
        const { base64Image, mimeType, prompt } = req.body;
        let contents = [];

        if (base64Image) {
            // Caso 1: Leitura de nota fiscal (Imagem Base64)
            const base64Data = Array.isArray(base64Image) ? base64Image[0] : base64Image;
            contents = [{
                parts: [
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: mimeType || 'image/jpeg'
                        }
                    },
                    {
                        text: "Analisa esta nota fiscal/cupom e devolve estritamente um JSON puro no formato array de objetos com campos nome e qtd: [{\"nome\": \"...\", \"qtd\": 1}]. Sem introduções, só o JSON limpo."
                    }
                ]
            }];
        } else if (prompt) {
            // Caso 2: Assistente de compras (Texto/Prompt)
            contents = [{
                parts: [{ text: prompt }]
            }];
        } else {
            return res.status(400).json({ error: 'Payload inválido: nem imagem nem prompt fornecidos.' });
        }

        // CORRIGIDO: Alterado para gemini-3.6-flash
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ error: errText });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('Erro no /api/comprasIA:', error);
        return res.status(500).json({ error: error.message });
    }
};
