export default async function handler(req, res) {
    // Bloqueia se não for requisição POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { base64Image, mimeType } = req.body;
    
    // Puxa a variável de ambiente segura cadastrada lá no painel do Vercel
    const CHAVE_API_GEMINI = process.env.GEMINI_API_KEY;

    if (!CHAVE_API_GEMINI) {
        return res.status(500).json({ error: 'Chave da API não configurada no servidor.' });
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CHAVE_API_GEMINI}`;
        const payload = {
            contents: [{
                parts: [
                    { text: "Você é um extrator de dados de notas fiscais. Analise a imagem desta nota. Identifique APENAS os nomes dos produtos e a quantidade de cada um. Retorne a resposta EXATAMENTE no formato de array JSON, assim: [{\"nome\": \"Nome do Produto\", \"qtd\": 10}]. Não escreva mais nada, não use markdown (sem blocos ```json), retorne apenas o array cru." },
                    { inline_data: { mime_type: mimeType, data: base64Image } }
                ]
            }]
        };

        const resposta = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const dados = await resposta.json();
        
        if (dados.error) throw new Error(dados.error.message);

        // Devolve pro front o mesmo formato
        res.status(200).json(dados);
    } catch (erro) {
        res.status(500).json({ error: erro.message });
    }
}
