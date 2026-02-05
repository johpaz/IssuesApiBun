import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/environment';

export class TimeEstimator {
    genAI: GoogleGenerativeAI;

    constructor() {
        this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }

    async estimateTime(taskData: { taskTitle: string; taskDescription: string }) {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

            const prompt = `
        Estima el tiempo necesario para completar la siguiente tarea:

        Título: ${taskData.taskTitle}
        Descripción: ${taskData.taskDescription}

        Por favor, proporciona la estimación en el siguiente formato JSON:
        {
          "estimatedTimeHours": número,
          "reasoning": "breve explicación de la estimación",
          "complexity": "low|medium|high"
        }

        Complejidad:
        - low: tareas simples, rutinarias
        - medium: tareas con cierta complejidad
        - high: tareas complejas que requieren investigación o múltiples pasos

        Estimación de tiempo en horas:
        - Considera que un desarrollador promedio trabaja 8 horas al día
        - Incluye tiempo para pruebas y revisión
        - Sé conservador en la estimación
      `;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const estimation = JSON.parse(jsonMatch[0]);
                return estimation;
            }

            // Fallback if JSON parsing fails
            return {
                estimatedTimeHours: 4,
                reasoning: 'No se pudo parsear la respuesta de la IA',
                complexity: 'medium'
            };
        } catch (error) {
            console.error('Error in time estimation:', error);
            return {
                estimatedTimeHours: 4,
                reasoning: 'Error en la estimación automática',
                complexity: 'medium'
            };
        }
    }
}
