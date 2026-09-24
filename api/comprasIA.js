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
            contents = [{
                parts: [{ text: prompt }]
            }];
        } else {
            return res.status(400).json({ error: 'Payload inválido: nem imagem nem prompt fornecidos.' });
        }

        // URL com o SEU modelo exato
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
        
        let tentativas = 3; // O servidor vai tentar 3 vezes antes de desistir
        let response;
        
        while (tentativas > 0) {
            response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents })
            });

            // Se for erro 503, espera 2.5 segundos e tenta novamente
            if (response.status === 503) {
                tentativas--;
                if (tentativas === 0) break; // Acabaram as tentativas
                await new Promise(resolve => setTimeout(resolve, 2500)); 
            } else {
                // Se for sucesso (200) ou outro erro diferente de 503, sai do loop e continua
                break; 
            }
        }

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
