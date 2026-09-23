// Exemplo estruturado para /api/lerNota (Node.js / Vercel Serverless Function)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { base64Image, mimeType } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no Vercel' });
    }

    if (!base64Image) {
      return res.status(400).json({ error: 'Imagem em base64 não enviada' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Analise esta nota fiscal/cupom e retorne APENAS um JSON válido no formato de lista de objetos: [{"nome": "produto", "qtd": 1}]. Sem markdown extra se possível, ou limpo.'
                },
                {
                  inline_data: {
                    mime_type: mimeType || 'image/jpeg',
                    data: base64Image
                  }
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'Erro na API do Gemini' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Erro interno em /api/lerNota:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
}
