"use client";

import { useEffect, useRef, useState } from "react";
import { initTypeGPU } from "@/lib/typegpu-setup";
import { BlurType } from "@/lib/blur-utils";

export function RealtimeBlurControls() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [blurIntensity, setBlurIntensity] = useState(0.5);
  const [blurRadius, setBlurRadius] = useState(0.15);
  const [blurType, setBlurType] = useState<BlurType>("gaussian");
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const init = async () => {
      try {
        const tgpu = await initTypeGPU();
        if (!tgpu) {
          setError("WebGPU is not available");
          return;
        }

        const device = tgpu.device;
        const context = canvas.getContext("webgpu");
        if (!context) {
          setError("Failed to get WebGPU context");
          return;
        }

        const format = navigator.gpu!.getPreferredCanvasFormat();
        context.configure({
          device,
          format,
        });

        // 頂点シェーダー
        const vertexShader = device.createShaderModule({
          label: "RealtimeBlurControls vertex shader",
          code: `
            struct VertexOutput {
              @builtin(position) position: vec4<f32>,
              @location(0) uv: vec2<f32>,
            }

            @vertex
            fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
              var output: VertexOutput;
              let x = f32((vertexIndex << 1u) & 2u) * 2.0 - 1.0;
              let y = f32(vertexIndex & 2u) * 2.0 - 1.0;
              output.position = vec4<f32>(x, y, 0.0, 1.0);
              output.uv = vec2<f32>(x * 0.5 + 0.5, 1.0 - (y * 0.5 + 0.5));
              return output;
            }
          `,
        });

        // フラグメントシェーダー（リアルタイムブラー調整）
        const fragmentShader = device.createShaderModule({
          label: "RealtimeBlurControls fragment shader",
          code: `
            @group(0) @binding(0) var<uniform> params: vec4<f32>; // intensity, radius, blurType, time

            // ガウシアン重み
            fn gaussianWeight(dist: f32, sigma: f32) -> f32 {
              return exp(-(dist * dist) / (2.0 * sigma * sigma));
            }

            // ボックス重み
            fn boxWeight(dist: f32, radius: f32) -> f32 {
              return select(0.0, 1.0, dist <= radius);
            }

            // シンプルな文字描画関数（"BLUR"を描画）
            fn drawText(uv: vec2<f32>, textPos: vec2<f32>) -> f32 {
              let charSize = vec2<f32>(0.06, 0.1);
              let spacing = 0.08;
              
              let char0UV = (uv - textPos) / charSize; // B
              let char1UV = (uv - textPos - vec2<f32>(spacing, 0.0)) / charSize; // L
              let char2UV = (uv - textPos - vec2<f32>(spacing * 2.0, 0.0)) / charSize; // U
              let char3UV = (uv - textPos - vec2<f32>(spacing * 3.0, 0.0)) / charSize; // R
              
              var result = 0.0;
              
              if (char0UV.x >= 0.0 && char0UV.x < 1.0 && char0UV.y >= 0.0 && char0UV.y < 1.0) {
                if ((char0UV.x < 0.15) || (char0UV.y < 0.15 && char0UV.x < 0.85) || 
                    (char0UV.y > 0.4 && char0UV.y < 0.6 && char0UV.x < 0.85) || 
                    (char0UV.y > 0.85 && char0UV.x < 0.85) || 
                    (char0UV.x > 0.7 && char0UV.x < 0.85)) {
                  result = 1.0;
                }
              }
              
              if (char1UV.x >= 0.0 && char1UV.x < 1.0 && char1UV.y >= 0.0 && char1UV.y < 1.0) {
                if ((char1UV.x < 0.15) || (char1UV.y > 0.85 && char1UV.x < 0.85)) {
                  result = 1.0;
                }
              }
              
              if (char2UV.x >= 0.0 && char2UV.x < 1.0 && char2UV.y >= 0.0 && char2UV.y < 1.0) {
                if ((char2UV.x < 0.15) || (char2UV.x > 0.7 && char2UV.x < 0.85) || 
                    (char2UV.y > 0.85 && char2UV.x < 0.85)) {
                  result = 1.0;
                }
              }
              
              if (char3UV.x >= 0.0 && char3UV.x < 1.0 && char3UV.y >= 0.0 && char3UV.y < 1.0) {
                if ((char3UV.x < 0.15) || (char3UV.y < 0.15 && char3UV.x < 0.85) || 
                    (char3UV.y > 0.4 && char3UV.y < 0.6 && char3UV.x < 0.85) || 
                    (char3UV.x > 0.7 && char3UV.x < 0.85 && char3UV.y < 0.5) || 
                    (char3UV.x > 0.5 && char3UV.y > 0.5 && abs(char3UV.x - char3UV.y + 0.3) < 0.1)) {
                  result = 1.0;
                }
              }
              
              return result;
            }

            @fragment
            fn realtimeBlurFragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
              let intensity = params.x;
              let radius = params.y;
              let blurType = params.z;
              let time = params.w;
              
              // 背景パターン（アニメーション）
              let pattern = sin(uv.x * 10.0 + time) * sin(uv.y * 10.0 + time) * 0.5 + 0.5;
              let baseColor = mix(
                vec3<f32>(0.2, 0.3, 0.8),
                vec3<f32>(0.8, 0.2, 0.4),
                pattern
              );
              
              // ブラー効果を適用（WebGPU公式サンプルに基づく実装）
              // https://github.com/webgpu/webgpu-samples/tree/main/sample/imageBlur
              var color = vec4<f32>(0.0);
              var totalWeight = 0.0;
              
              // ブラー半径をUV座標系に変換（適切なスケール）
              let blurRadiusUV = radius * intensity;
              
              if (blurType < 0.5) {
                // ガウシアンブラー: WebGPU公式サンプルのアプローチを参考に
                // sigma値を正しく計算
                let sigma = blurRadiusUV / 3.0;
                // サンプリング範囲を3*sigmaに制限（99.7%のカバレッジ）
                let sampleRadius = sigma * 3.0;
                // フィルターサイズを計算（WebGPU公式サンプルのfilterSizeに相当）
                let filterSize = u32(clamp(sampleRadius * 200.0, 3.0, 33.0));
                // フィルターオフセット（中心からの距離）
                let filterOffset = (filterSize - 1u) / 2u;
                
                // グリッドベースのサンプリング（WebGPU公式サンプルのアプローチ）
                for (var y = 0u; y < filterSize; y++) {
                  for (var x = 0u; x < filterSize; x++) {
                    let offsetX = f32(i32(x) - i32(filterOffset)) * (sampleRadius / f32(filterSize));
                    let offsetY = f32(i32(y) - i32(filterOffset)) * (sampleRadius / f32(filterSize));
                    let offset = vec2<f32>(offsetX, offsetY);
                    let sampleUV = uv + offset;
                    
                    if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
                      let dist = length(offset);
                      // ガウシアン重み
                      let weight = gaussianWeight(dist, sigma);
                      
                      // サンプル位置の色を計算
                      let samplePattern = sin(sampleUV.x * 10.0 + time) * sin(sampleUV.y * 10.0 + time) * 0.5 + 0.5;
                      var sampleColor = mix(
                        vec3<f32>(0.2, 0.3, 0.8),
                        vec3<f32>(0.8, 0.2, 0.4),
                        samplePattern
                      );
                      
                      // 文字を描画
                      let textPos = vec2<f32>(0.15, 0.45);
                      let textMask = drawText(sampleUV, textPos);
                      if (textMask > 0.5) {
                        sampleColor = vec3<f32>(1.0, 1.0, 1.0);
                      }
                      
                      color += vec4<f32>(sampleColor, 1.0) * weight;
                      totalWeight += weight;
                    }
                  }
                }
              } else if (blurType < 1.5) {
                // ボックスブラー: WebGPU公式サンプルのボックスフィルター実装を参考に
                // フィルターサイズを計算
                let filterSize = u32(clamp(blurRadiusUV * 200.0, 3.0, 33.0));
                let filterOffset = (filterSize - 1u) / 2u;
                // 均一な重み（WebGPU公式サンプル: 1.0 / filterDim）
                let uniformWeight = 1.0 / f32(filterSize * filterSize);
                
                // グリッドベースのサンプリング（WebGPU公式サンプルのアプローチ）
                for (var y = 0u; y < filterSize; y++) {
                  for (var x = 0u; x < filterSize; x++) {
                    let offsetX = f32(i32(x) - i32(filterOffset)) * (blurRadiusUV / f32(filterSize));
                    let offsetY = f32(i32(y) - i32(filterOffset)) * (blurRadiusUV / f32(filterSize));
                    let offset = vec2<f32>(offsetX, offsetY);
                    let sampleUV = uv + offset;
                    
                    if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
                      let dist = length(offset);
                      // ボックス内かどうかをチェック
                      if (dist <= blurRadiusUV) {
                        let weight = uniformWeight;
                        
                        let samplePattern = sin(sampleUV.x * 10.0 + time) * sin(sampleUV.y * 10.0 + time) * 0.5 + 0.5;
                        var sampleColor = mix(
                          vec3<f32>(0.2, 0.3, 0.8),
                          vec3<f32>(0.8, 0.2, 0.4),
                          samplePattern
                        );
                        
                        let textPos = vec2<f32>(0.15, 0.45);
                        let textMask = drawText(sampleUV, textPos);
                        if (textMask > 0.5) {
                          sampleColor = vec3<f32>(1.0, 1.0, 1.0);
                        }
                        
                        color += vec4<f32>(sampleColor, 1.0) * weight;
                        totalWeight += weight;
                      }
                    }
                  }
                }
              } else {
                // モーションブラー: 方向性のあるブラー
                let motionDir = normalize(vec2<f32>(cos(time), sin(time)));
                let sigma = blurRadiusUV / 3.0;
                let sampleRadius = sigma * 3.0;
                let filterSize = u32(clamp(sampleRadius * 200.0, 3.0, 33.0));
                let filterOffset = (filterSize - 1u) / 2u;
                
                for (var y = 0u; y < filterSize; y++) {
                  for (var x = 0u; x < filterSize; x++) {
                    let offsetX = f32(i32(x) - i32(filterOffset)) * (sampleRadius / f32(filterSize));
                    let offsetY = f32(i32(y) - i32(filterOffset)) * (sampleRadius / f32(filterSize));
                    let offset = vec2<f32>(offsetX, offsetY);
                    let sampleUV = uv + offset;
                    
                    if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
                      let dist = length(offset);
                      if (dist <= sampleRadius) {
                        // モーション方向への射影
                        let offsetDir = normalize(offset);
                        let dotProduct = dot(offsetDir, motionDir);
                        // モーション方向に沿った重みを計算
                        let motionWeight = exp(-abs(dotProduct) * 3.0);
                        let weight = gaussianWeight(dist, sigma) * motionWeight;
                        
                        let samplePattern = sin(sampleUV.x * 10.0 + time) * sin(sampleUV.y * 10.0 + time) * 0.5 + 0.5;
                        var sampleColor = mix(
                          vec3<f32>(0.2, 0.3, 0.8),
                          vec3<f32>(0.8, 0.2, 0.4),
                          samplePattern
                        );
                        
                        let textPos = vec2<f32>(0.15, 0.45);
                        let textMask = drawText(sampleUV, textPos);
                        if (textMask > 0.5) {
                          sampleColor = vec3<f32>(1.0, 1.0, 1.0);
                        }
                        
                        color += vec4<f32>(sampleColor, 1.0) * weight;
                        totalWeight += weight;
                      }
                    }
                  }
                }
              }
              
              if (totalWeight > 0.0) {
                color /= totalWeight;
              } else {
                color = vec4<f32>(baseColor, 1.0);
              }
              
              // 最終的な色に文字を描画（ブラー適用後）
              let textPos = vec2<f32>(0.15, 0.45);
              let textMask = drawText(uv, textPos);
              if (textMask > 0.5) {
                color = mix(color, vec4<f32>(1.0, 1.0, 1.0, 1.0), 0.8);
              }
              
              return color;
            }
          `,
        });

        // レンダーパイプライン
        const pipeline = device.createRenderPipeline({
          label: "RealtimeBlurControls pipeline",
          layout: "auto",
          vertex: {
            module: vertexShader,
            entryPoint: "vertexMain",
          },
          fragment: {
            module: fragmentShader,
            entryPoint: "realtimeBlurFragment",
            targets: [{ format }],
          },
          primitive: {
            topology: "triangle-strip",
          },
        });

        // ユニフォームバッファ
        const uniformBuffer = device.createBuffer({
          size: 16, // vec4<f32> = 16 bytes
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const startTime = Date.now();

        const render = () => {
          const currentTime = (Date.now() - startTime) / 1000.0;

          // ブラータイプを数値に変換
          let blurTypeValue = 0.0;
          if (blurType === "box") blurTypeValue = 1.0;
          else if (blurType === "motion") blurTypeValue = 2.0;

          const params = new Float32Array([
            blurIntensity,
            blurRadius,
            blurTypeValue,
            currentTime,
          ]);
          device.queue.writeBuffer(uniformBuffer, 0, params);

          const encoder = device.createCommandEncoder();
          const pass = encoder.beginRenderPass({
            colorAttachments: [
              {
                view: context.getCurrentTexture().createView(),
                clearValue: { r: 0.05, g: 0.05, b: 0.1, a: 1.0 },
                loadOp: "clear",
                storeOp: "store",
              },
            ],
          });

          pass.setPipeline(pipeline);
          const bindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
              {
                binding: 0,
                resource: { buffer: uniformBuffer },
              },
            ],
          });
          pass.setBindGroup(0, bindGroup);
          pass.draw(4);
          pass.end();

          device.queue.submit([encoder.finish()]);
          animationFrameRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    init();
  }, [blurIntensity, blurRadius, blurType]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-800 dark:text-red-200">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="shrink-0 space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              ブラー強度: {blurIntensity.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={blurIntensity}
              onChange={(e) => setBlurIntensity(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              ブラー半径: {blurRadius.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.01"
              value={blurRadius}
              onChange={(e) => setBlurRadius(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              ブラータイプ
            </label>
            <select
              value={blurType}
              onChange={(e) => setBlurType(e.target.value as BlurType)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="gaussian">ガウシアン</option>
              <option value="box">ボックス</option>
              <option value="motion">モーション</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-lg"
          width={800}
          height={600}
        />
      </div>
    </div>
  );
}
