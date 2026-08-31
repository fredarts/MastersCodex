import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

async function resolveSourceImageBase64(sourceImage: string): Promise<{ mimeType: string; base64Data: string } | null> {
  try {
    if (sourceImage.startsWith('data:')) {
      const match = sourceImage.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        return { mimeType: match[1], base64Data: match[2] };
      }
    } else if (sourceImage.startsWith('http://') || sourceImage.startsWith('https://')) {
      const res = await fetch(sourceImage);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const mimeType = res.headers.get('content-type') || 'image/jpeg';
        return { mimeType, base64Data: Buffer.from(arrayBuffer).toString('base64') };
      }
    }
  } catch (err) {
    console.warn('[ImageAPI] Erro ao resolver sourceImage:', err);
  }
  return null;
}

const NO_TEXT_DIRECTIVE = 'CRITICAL RULE: Absolutely NO text, NO typography, NO letters, NO words, NO subtitles, NO captions, NO signatures, NO watermarks, NO UI elements, NO speech bubbles, NO frames, NO borders, NO labels. Pure visual artwork and illustration only.';

async function tryGenerateWithGoogle(
  ai: GoogleGenAI,
  modelName: string,
  prompt: string,
  aspectRatio: string,
  sourceImagesResolved: { mimeType: string; base64Data: string }[] = []
): Promise<string | null> {
  try {
    const promptWithNoText = `${prompt}. ${NO_TEXT_DIRECTIVE}`;

    // Se for modelo Gemini multimodal (gemini-2.5-flash / gemini-3.1...)
    if (modelName.startsWith('gemini')) {
      const contents: any[] = [];
      for (const img of sourceImagesResolved) {
        contents.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.base64Data,
          },
        });
      }
      const refInstruction = sourceImagesResolved.length > 0
        ? `CRITICAL REFERENCE FIDELITY: Use the visual appearance, face, clothing/armor, and environmental architecture from the provided reference images. `
        : '';

      contents.push(`${refInstruction}${promptWithNoText}`);

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          imageConfig: {
            aspectRatio,
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          return part.inlineData.data;
        } else if ((part as any).inline_data?.data) {
          return (part as any).inline_data.data;
        }
      }
    } else {
      // Modelos Imagen (como imagen-3.0-generate-002 / imagen-3.0-generate-001)
      let finalPrompt = promptWithNoText;

      // Se houver imagens de referência, usamos Gemini multimodal para analisar todas as referências e compor um prompt sintetizado de alta fidelidade para o Imagen 3
      if (sourceImagesResolved.length > 0) {
        try {
          const visionContents: any[] = [];
          for (const img of sourceImagesResolved) {
            visionContents.push({
              inlineData: {
                mimeType: img.mimeType,
                data: img.base64Data,
              },
            });
          }
          visionContents.push(
            `Analyze these character and/or environment reference images. Describe their key visual features (character faces, armor, colors, creatures, architectural style) and combine them into this new scene: "${prompt}". Return a cohesive, highly detailed English prompt suitable for Imagen 3 without any text or subtitles.`
          );

          const visionResp = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: visionContents,
          });
          const refined = visionResp.text?.trim();
          if (refined) {
            finalPrompt = `${refined}. High quality fantasy RPG concept art, cinematic lighting, 8k resolution. ${NO_TEXT_DIRECTIVE}`;
          }
        } catch (visionErr) {
          console.warn('[ImageAPI] Falha ao analisar imagens com vision, usando prompt direto:', visionErr);
        }
      }

      const response = await ai.models.generateImages({
        model: modelName,
        prompt: finalPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio,
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const img = response.generatedImages[0].image;
        if (img && img.imageBytes) {
          return img.imageBytes;
        }
      }
    }
  } catch (err: any) {
    console.warn(`[ImageAPI] Modelo ${modelName} falhou (${err?.status || err?.message || err}). Tentando próximo...`);
  }
  return null;
}

async function tryGenerateWithPollinations(prompt: string, aspectRatio: string): Promise<string | null> {
  try {
    let width = 1024;
    let height = 1024;

    switch (aspectRatio) {
      case '9:16':
        width = 768;
        height = 1365;
        break;
      case '3:4':
        width = 768;
        height = 1024;
        break;
      case '4:3':
        width = 1024;
        height = 768;
        break;
      case '16:9':
        width = 1365;
        height = 768;
        break;
      case '1:1':
      default:
        width = 1024;
        height = 1024;
        break;
    }

    const seed = Math.floor(Math.random() * 999999);
    const encodedPrompt = encodeURIComponent(`Masterpiece, Dungeons & Dragons RPG fantasy concept art, clean artwork, no text, no words: ${prompt} ${NO_TEXT_DIRECTIVE}`);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (err: any) {
    console.warn('[ImageAPI] Fallback Pollinations falhou:', err?.message || err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, aspectRatio: requestedAspectRatio, sourceImage, sourceImages, referenceImages } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'O prompt é obrigatório.' }, { status: 400 });
    }

    const userSettings = body.userSettings || {};
    const geminiApiKey = userSettings.geminiApiKey || process.env.GEMINI_API_KEY;
    const preferredModel = userSettings.imageModel || 'imagen-3.0-generate-002';
    const finalAspectRatio = requestedAspectRatio || '9:16';

    // Unificar lista de imagens de referência (suporta sourceImage, sourceImages e referenceImages)
    const rawImagesList: string[] = [];
    if (sourceImage && typeof sourceImage === 'string') rawImagesList.push(sourceImage);
    if (Array.isArray(sourceImages)) rawImagesList.push(...sourceImages.filter(Boolean));
    if (Array.isArray(referenceImages)) rawImagesList.push(...referenceImages.filter(Boolean));

    // Resolver Base64 em paralelo
    const resolvedImages = (
      await Promise.all(rawImagesList.map((img) => resolveSourceImageBase64(img)))
    ).filter((r): r is { mimeType: string; base64Data: string } => r !== null);

    let base64Image: string | null = null;

    // 1. Tentar com a API do Google priorizando o modelo escolhido nas configurações
    if (geminiApiKey && geminiApiKey !== 'your-gemini-api-key-here') {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const candidateModels = [
        preferredModel,
        'imagen-3.0-generate-002',
        'imagen-3.0-generate-001',
        'imagen-3.0-fast-generate-001',
        'gemini-2.5-flash',
      ].filter((m, idx, arr) => arr.indexOf(m) === idx);

      for (const model of candidateModels) {
        base64Image = await tryGenerateWithGoogle(ai, model, prompt, finalAspectRatio, resolvedImages);
        if (base64Image) {
          console.info(`[ImageAPI] Imagem gerada com sucesso usando o modelo: ${model}`);
          break;
        }
      }
    }

    // 2. Se o Google estiver temporariamente com erro 503 (alta demanda) ou sem chave, usar fallback resiliente Flux
    if (!base64Image) {
      console.info('[ImageAPI] Acionando fallback resiliente de geração de imagem...');
      base64Image = await tryGenerateWithPollinations(prompt, finalAspectRatio);
    }

    if (base64Image) {
      return NextResponse.json({ base64: base64Image });
    }

    return NextResponse.json({ 
      error: 'Os servidores de geração de imagem estão com alta demanda temporária. Por favor, tente novamente em alguns instantes.' 
    }, { status: 503 });

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
