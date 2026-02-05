import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/environment';

export class TaskClassifierService {
    genAI: GoogleGenerativeAI;

    constructor() {
        this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }

    async classifyTask(taskData: { title: string; description: string }) {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

            const prompt = `
        Analiza la siguiente tarea y clasifícala según los siguientes criterios:

        Título: ${taskData.title}
        Descripción: ${taskData.description}

        Por favor, proporciona la clasificación en el siguiente formato JSON:
        {
          "suggestedPriority": "low|medium|high",
          "suggestedTags": ["tag1", "tag2", "tag3"],
          "reasoning": "breve explicación de la clasificación"
        }

        Prioridades:
        - low: tareas no urgentes, pueden esperar
        - medium: tareas con importancia moderada
        - high: tareas urgentes o críticas

        Etiquetas sugeridas (tags):
        - desarrollo, frontend, backend, base de datos
        - soporte, bug, error, fix
        - documentación, tutorial, guía
        - diseño, ui, ux
        - testing, qa, pruebas
      `;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const classification = JSON.parse(jsonMatch[0]);
                return classification;
            }

            // Fallback if JSON parsing fails
            return {
                suggestedPriority: 'medium',
                suggestedTags: ['general'],
                reasoning: 'No se pudo parsear la respuesta de la IA'
            };
        } catch (error) {
            console.error('Error in task classification:', error);
            return {
                suggestedPriority: 'medium',
                suggestedTags: ['general'],
                reasoning: 'Error en la clasificación automática'
            };
        }
    }
}
