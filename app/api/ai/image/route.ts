import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, aspectRatio: requestedAspectRatio } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'O prompt é obrigatório.' }, { status: 400 });
    }

    const userSettings = body.userSettings || {};
    const geminiApiKey = userSettings.geminiApiKey || process.env.GEMINI_API_KEY;

    if (!geminiApiKey || geminiApiKey === 'your-gemini-api-key-here') {
      return NextResponse.json({ error: 'API Key do Gemini não configurada.' }, { status: 500 });
    }

    const imageModel = userSettings.imageModel || 'imagen-3.0-generate-001';
    const finalAspectRatio = requestedAspectRatio || '9:16';

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    let base64Image: string | null = null;

    if (imageModel.startsWith('gemini')) {
      // Modelos Gemini (como Nano Banana 2) geram imagens retornando-as como partes de conteúdo (inlineData)
      const response = await ai.models.generateContent({
        model: imageModel,
        contents: [prompt],
        config: {
          imageConfig: {
            aspectRatio: finalAspectRatio
          }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          base64Image = part.inlineData.data;
          break;
        } else if ((part as any).inline_data?.data) {
          // Fallback para caso a SDK retorne snake_case
          base64Image = (part as any).inline_data.data;
          break;
        }
      }
    } else {
      // Modelos Imagen (como imagen-3) usam o endpoint dedicado generateImages
      const response = await ai.models.generateImages({
        model: imageModel,
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: finalAspectRatio,
        }
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const image = response.generatedImages[0].image;
        if (image && image.imageBytes) {
          base64Image = image.imageBytes;
        }
      }
    }

    if (base64Image) {
      return NextResponse.json({ base64: base64Image });
    }

    return NextResponse.json({ error: 'Nenhuma imagem gerada pelo modelo.' }, { status: 500 });
  } catch (error: any) {
    console.error('Erro na geração de imagem:', error);
    try {
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(process.cwd(), 'image-api-error.log');
      fs.appendFileSync(logPath, `${new Date().toISOString()} - Error: ${error.message || error}\nStack: ${error.stack}\nDetails: ${JSON.stringify(error)}\n\n`);
    } catch (logError) {}
    return NextResponse.json(
      { error: 'Erro interno ao processar a geração de imagem.', details: error?.message },
      { status: 500 }
    );
  }
}

