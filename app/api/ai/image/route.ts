import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'O prompt é obrigatório.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      return NextResponse.json({ error: 'API Key do Gemini não configurada.' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      }
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const imageBase64 = response.generatedImages[0].image.imageBytes;
      return NextResponse.json({ base64: imageBase64 });
    }

    return NextResponse.json({ error: 'Nenhuma imagem gerada.' }, { status: 500 });
  } catch (error: any) {
    console.error('Erro na geração de imagem:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a geração de imagem.', details: error?.message },
      { status: 500 }
    );
  }
}
