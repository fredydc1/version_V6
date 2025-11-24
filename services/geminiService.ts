import { GoogleGenAI } from "@google/genai";
import { Transaction } from '../types';

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "API Key no configurada. Por favor, asegúrate de tener acceso a la API de Gemini.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Prepare data for the model (limit to last 20 for brevity in token usage)
    const recentTransactions = transactions.slice(0, 20).map(t => 
      `${t.date}: ${t.type} de $${t.amount} (${t.category}) - ${t.description}`
    ).join('\n');

    const prompt = `
      Actúa como un analista financiero experto para pequeños negocios.
      Analiza las siguientes transacciones recientes de mi negocio:
      
      ${recentTransactions}
      
      Proporciona un resumen breve de 3 puntos clave:
      1. Una observación sobre la salud financiera.
      2. Una tendencia notable en gastos o ingresos.
      3. Una recomendación accionable para mejorar la rentabilidad.
      
      Mantén el tono profesional pero alentador. Usa formato Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Hubo un error al conectar con el analista virtual. Inténtalo más tarde.";
  }
};
