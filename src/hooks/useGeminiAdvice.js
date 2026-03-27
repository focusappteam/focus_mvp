import { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

// Instancia el cliente con tu API key
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export function useGeminiAdvice(sessions, completedTasks) {
    const [advice, setAdvice] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Si no hay datos, mostramos un consejo genérico instantáneo
        if (!sessions || sessions.length === 0) {
            setAdvice("Empieza tu primera sesión de foco para recibir consejos personalizados basados en tu rendimiento.");
            return;
        }

        async function fetchAdvice() {
            // 1. Revisar caché primero (limitamos a 1 consejo por día por sesión)
            const today = new Date().toISOString().split('T')[0];
            const cacheKey = `gemini_advice_${today}`;
            const cachedAdvice = sessionStorage.getItem(cacheKey);

            if (cachedAdvice) {
                setAdvice(cachedAdvice);
                return;
            }

            setLoading(true);

            try {
                // 2. Preparamos el payload ligero
                const focusLog = sessions.slice(0, 10).map(s => ({
                    timeOfDay: new Date(s.started_at).getHours(),
                    durationMinutes: Math.round((s.duration_seconds || 0) / 60),
                    category: s.task_category
                }));

                const dataPayload = JSON.stringify({
                    totalSessions: sessions.length,
                    tasksCompleted: completedTasks.length,
                    recentSessions: focusLog
                });

                // 3. Construimos el prompt optimizado
                const prompt = `
Eres un coach experto en Deep Work.
Aquí están mis datos recientes de concentración:
${dataPayload}

Instrucciones estrictas:
Analiza los datos y dame UN ÚNICO consejo o insight accionable basado en mi comportamiento. 

REGLAS OBLIGATORIAS:
1. Máximo 280 caracteres en total.
2. Tono directo, motivador y sin saludos.
3. Texto plano (sin viñetas, sin markdown, sin negritas).
`;

                // 4. Sistema Multi-modelo Fallback
                const modelsToTry = [
                    'gemini-2.5-flash',
                    'gemini-2.5-flash-8b',
                    'gemini-2.0-flash',
                    'gemini-1.5-flash'
                ];

                let response = null;
                let success = false;

                for (const modelName of modelsToTry) {
                    try {
                        console.log(`Intentando con Gemini: ${modelName}...`);
                        response = await ai.models.generateContent({
                            model: modelName,
                            contents: prompt,
                        });
                        success = true;
                        break; // Salió bien, rompemos el bucle
                    } catch (modelError) {
                        const isRateLimit = modelError.status === 429 ||
                            (modelError.message && modelError.message.includes('RESOURCE_EXHAUSTED'));

                        if (isRateLimit) {
                            console.warn(`⏳ Límite en ${modelName}. Cambiando de modelo...`);
                            continue; // Intentamos el siguiente modelo
                        } else {
                            throw modelError; // Error grave (ej. no hay internet, key inválida)
                        }
                    }
                }

                if (success && response) {
                    const finalAdvice = response.text.trim();
                    setAdvice(finalAdvice);
                    // Guardamos en sessionStorage para evitar re-fetches innecesarios
                    sessionStorage.setItem(cacheKey, finalAdvice);
                } else {
                    throw new Error("Todos los modelos agotaron su cuota.");
                }

            } catch (err) {
                console.error("Error fetching Gemini advice:", err);
                const fallbackMessage = "Sigue manteniendo el ritmo constante, ¡lo estás haciendo genial!";
                setError(fallbackMessage);
                setAdvice(fallbackMessage);
            } finally {
                setLoading(false);
            }
        }

        fetchAdvice();
    }, [sessions, completedTasks]);

    return { advice: advice || error, loadingAdvice: loading };
}