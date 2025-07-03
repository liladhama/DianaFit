import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

export async function callMistralAI(messages) {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
        throw new Error('MISTRAL_API_KEY не настроен в .env файле');
    }

    try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-small',
                messages: messages,
                temperature: 0.7,
                max_tokens: 800
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Ошибка API Mistral: ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Ошибка при вызове Mistral AI:', error);
        throw error;
    }
}
