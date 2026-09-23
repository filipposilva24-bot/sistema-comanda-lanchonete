export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { estoque, resumoVendas } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no Vercel' });
    }

    const prompt = `Estás a atuar como o gestor inteligente de stock do "Point Derico" (snack bar / lanchonete).
Analisa o stock atual (itens, quantidades, unidades e limites mínimos críticos):
${JSON.stringify(estoque, null, 2)}

E o histórico recente de vendas/comandas pagas:
${JSON.stringify(resumoVendas, null, 2)}

Hoje é um dia de análise operacional. Considera o dia da semana atual, picos de fim de semana e o risco de rutura de stock iminente (ingredientes críticos, pães, carnes, bebidas).
Devolve uma resposta direta, em português, bem estruturada com:
1. 🚨 **Urgente (Comprar Hoje)**: O que está crítico ou vai acabar no pico.
2. 🛒 **Reposição Estratégica (Para o Fim de Semana/Próximos dias)**: Sugestão de quantidade exata baseada no histórico.
3. 💡 **Dica do Gestor IA**: Um conselho rápido de otimização de stock.

Usa formatação limpa (negritos, listas).`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'Erro na API do Gemini' });
    }

    const textoRecomendacao = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta gerada pela IA.';
    return res.status(200).json({ recomendacao: textoRecomendacao });

  } catch (error) {
    console.error('Erro em /api/comprasIA:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
}
