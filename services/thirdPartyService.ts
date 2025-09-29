import { AspectRatio, BFLModel, BFLInitiateResponse, BFLPollResponse } from "../types.ts";

// Security Warning: This service handles third-party API keys, please ensure not to commit configurations containing real keys to version control
// BFL debug logging tool
const BFL_DEBUG_LOGS = true; // Set to false to disable detailed logging

const bflLog = (message: string, data?: any) => {
  if (BFL_DEBUG_LOGS) {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

const bflError = (message: string, error?: any) => {
  if (BFL_DEBUG_LOGS) {
    if (error) {
      console.error(message, error);
    } else {
      console.error(message);
    }
  }
};

// This service is for OpenAI-compatible APIs
export const generateTextOpenAI = async (
  apiUrl: string,
  apiKey: string,
  model: string,
  systemInstruction: string,
  prompt: string
): Promise<string> => {
  if (!apiUrl || !apiKey) {
    throw new Error("Third-party API URL or API Key is not configured.");
  }

  const response = await fetch(`${apiUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Third-party API Error: ${errorData.error?.message || errorData.message}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

export const fetchModelsOpenAI = async (apiUrl: string, apiKey: string): Promise<string[]> => {
    if (!apiUrl || !apiKey) {
        throw new Error("API URL and API Key are required.");
    }
    const response = await fetch(`${apiUrl}/models`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        if (response.status === 401) throw new Error("Authentication failed. Check your API Key.");
        throw new Error(`Failed to fetch models: ${errorData.error?.message || errorData.message}`);
    }

    const data = await response.json();
    // OpenAI and compatible APIs usually return models in a `data` array
    if (data.data && Array.isArray(data.data)) {
        return data.data.map((model: any) => model.id).sort();
    }

    return [];
}


// Black Forest Labs (BFL) API service implementation
// Based on the reference documentation from bfl_api.txt

// Helper function to map aspect ratio to BFL dimensions
const mapAspectRatioToBFL = (aspectRatio: AspectRatio): { width: number; height: number } => {
  switch (aspectRatio) {
    case '1:1': return { width: 1024, height: 1024 };
    case '16:9': return { width: 1440, height: 810 };
    case '9:16': return { width: 810, height: 1440 };
    case '4:3': return { width: 1024, height: 768 };
    case '3:4': return { width: 768, height: 1024 };
    default: return { width: 1024, height: 1024 };
  }
};

// Helper function to get closest aspect ratio for Ultra models
const getClosestAspectRatio = (width: number, height: number): string => {
  const ratio = width / height;
  if (Math.abs(ratio - 1) < 0.1) return '1:1';
  if (Math.abs(ratio - 16/9) < 0.1) return '16:9';
  if (Math.abs(ratio - 9/16) < 0.1) return '9:16';
  if (Math.abs(ratio - 4/3) < 0.1) return '4:3';
  if (Math.abs(ratio - 3/4) < 0.1) return '3:4';
  return '1:1';
};

export const initiateImageGenerationBFL = async (
    apiKey: string,
    prompt: string,
    model: BFLModel,
    aspectRatio: AspectRatio,
    promptUpsampling: boolean = false,
    seed?: number
): Promise<BFLInitiateResponse> => {
    bflLog('🚀 [BFL] 开始初始化图像生成请求');
    bflLog('📋 [BFL] 参数:', { 
        model, 
        aspectRatio, 
        promptUpsampling, 
        seed,
        promptLength: prompt.length 
    });

    if (!apiKey) {
        bflError('❌ [BFL] API密钥未配置');
        throw new Error("BFL API Key is not configured.");
    }

    const { width, height } = mapAspectRatioToBFL(aspectRatio);
    bflLog('📐 [BFL] 宽高映射:', { aspectRatio, width, height });
    
    // Build complete request body first (like reference implementation)
    const requestBody: any = {
        prompt: prompt,
        steps: 20,
        guidance: 3.5,
        width: width,
        height: height,
        prompt_upsampling: promptUpsampling,
        seed: seed ?? null,
        safety_tolerance: 6, // being least strict
        output_format: 'jpeg',
    };

    // Model-specific parameter handling (delete unwanted parameters)
    if (model.endsWith('-ultra')) {
        requestBody.aspect_ratio = getClosestAspectRatio(width, height);
        delete requestBody.steps;
        delete requestBody.guidance;
        delete requestBody.width;
        delete requestBody.height;
        delete requestBody.prompt_upsampling;
        bflLog('🔧 [BFL] Ultra模型参数调整:', { aspect_ratio: requestBody.aspect_ratio });
    }

    if (model.endsWith('-pro-1.1')) {
        delete requestBody.steps;
        delete requestBody.guidance;
        bflLog('🔧 [BFL] Pro-1.1模型参数调整: 移除steps和guidance');
    }

    bflLog('📤 [BFL] 最终请求体:', JSON.stringify(requestBody, null, 2));

    // 使用代理服务器避免CORS问题
    const url = `http://localhost:3001/api/bfl/${model}`;
    bflLog('🌐 [BFL] 请求URL (通过代理):', url);
    bflLog('🔑 [BFL] API密钥长度:', apiKey.length);

    try {
        // 添加重试机制
        let lastError;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                bflLog(`🔄 [BFL] 尝试 ${attempt}/3`);
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-key': apiKey,
                        'User-Agent': 'Character-Crafter-AI/1.0',
                    },
                    body: JSON.stringify(requestBody),
                    // 添加超时设置
                    signal: AbortSignal.timeout(30000),
                });

                bflLog('📡 [BFL] 响应状态:', `${response.status} ${response.statusText}`);
                bflLog('📋 [BFL] 响应头:', Object.fromEntries(response.headers.entries()));

                if (!response.ok) {
                    const errorText = await response.text();
                    bflError('❌ [BFL] API错误响应:', errorText);
                    throw new Error(`BFL API Error: ${response.status} ${response.statusText} - ${errorText}`);
                }

                const result = await response.json();
                bflLog('✅ [BFL] 初始化成功:', result);
                
                if (!result.id) {
                    bflError('❌ [BFL] 响应中缺少任务ID:', result);
                    throw new Error('BFL API response missing task ID');
                }
                
                bflLog('🎯 [BFL] 任务ID:', result.id);
                return { id: result.id };
                
            } catch (error) {
                lastError = error;
                bflError(`💥 [BFL] 尝试 ${attempt} 失败:`, error.message);
                
                if (attempt < 3) {
                    const delay = attempt * 2000; // 2秒, 4秒
                    bflLog(`⏳ [BFL] 等待 ${delay}ms 后重试...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        // 所有重试都失败了
        bflError('💥 [BFL] 所有重试都失败了:', lastError);
        throw lastError;
        
    } catch (error) {
        bflError('💥 [BFL] 初始化请求失败:', error);
        throw error;
    }
};

export const pollImageBFL = async (
    taskId: string,
    apiKey: string
): Promise<BFLPollResponse> => {
    bflLog('🔄 [BFL] 开始轮询任务状态');
    bflLog('🎯 [BFL] 任务ID:', taskId);

    if (!taskId) {
        bflError('❌ [BFL] 任务ID缺失');
        throw new Error("Task ID is missing.");
    }

    // 使用代理服务器避免CORS问题
    const url = `http://localhost:3001/api/bfl/get_result?id=${taskId}`;
    bflLog('🌐 [BFL] 轮询URL (通过代理):', url);

    try {
        const response = await fetch(url, {
            method: 'GET',
            // 注意：轮询API不需要x-key请求头
        });

        bflLog('📡 [BFL] 轮询响应状态:', `${response.status} ${response.statusText}`);
        bflLog('📋 [BFL] 轮询响应头:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            bflError('❌ [BFL] 轮询错误响应:', errorText);
            throw new Error(`BFL Polling Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        bflLog('📊 [BFL] 轮询结果:', result);
        
        if (result.status === 'Ready' && result.result?.sample) {
            bflLog('✅ [BFL] 图像生成完成，开始下载图像');
            bflLog('🖼️ [BFL] 图像URL:', result.result.sample);
            
            // Convert the image URL to base64 data URL
            try {
                const imageResponse = await fetch(result.result.sample);
                bflLog('📡 [BFL] 图像下载响应:', `${imageResponse.status} ${imageResponse.statusText}`);
                
                if (!imageResponse.ok) {
                    throw new Error(`Image download failed: ${imageResponse.status} ${imageResponse.statusText}`);
                }
                
                const imageBlob = await imageResponse.blob();
                bflLog('📦 [BFL] 图像Blob大小:', `${imageBlob.size} bytes`);
                bflLog('📦 [BFL] 图像Blob类型:', imageBlob.type);
                
                const reader = new FileReader();
                const dataUrl = await new Promise<string>((resolve, reject) => {
                    reader.onload = () => {
                        bflLog('🔄 [BFL] 图像转换为DataURL完成');
                        resolve(reader.result as string);
                    };
                    reader.onerror = (error) => {
                        bflError('❌ [BFL] 图像转换失败:', error);
                        reject(error);
                    };
                    reader.readAsDataURL(imageBlob);
                });
                
                bflLog('✅ [BFL] 图像处理完成，DataURL长度:', dataUrl.length);
                
                return {
                    status: 'Ready',
                    result: {
                        sample: dataUrl
                    }
                };
            } catch (error) {
                bflError('💥 [BFL] 图像处理失败:', error);
                throw new Error('Failed to process generated image: ' + error.message);
            }
        }

        bflLog('⏳ [BFL] 任务状态:', result.status);
        return {
            status: result.status,
            result: result.result
        };
    } catch (error) {
        bflError('💥 [BFL] 轮询请求失败:', error);
        throw error;
    }
};