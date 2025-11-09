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
              
              // ブラー効果を適用
              var color = vec4<f32>(0.0);
              var totalWeight = 0.0;
              
              let samples = 16u;
              let blurAmount = intensity * radius;
              
              for (var i = 0u; i < samples; i++) {
                let angle = f32(i) / f32(samples) * 6.28318; // 2 * PI
                let offset = vec2<f32>(cos(angle), sin(angle)) * blurAmount;
                let sampleUV = uv + offset;
                
                if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
                  let sampleDist = length(offset);
                  var weight = 0.0;
                  
                  // ブラータイプに応じて重みを計算
                  if (blurType < 0.5) {
                    // ガウシアン
                    weight = gaussianWeight(sampleDist, radius * 0.1);
                  } else if (blurType < 1.5) {
                    // ボックス
                    weight = boxWeight(sampleDist, blurAmount);
                  } else {
                    // モーション（方向性）
                    let motionDir = vec2<f32>(cos(time), sin(time));
                    let dotProduct = dot(normalize(offset), motionDir);
                    weight = exp(-abs(dotProduct) * 5.0) * gaussianWeight(sampleDist, radius * 0.1);
                  }
                  
                  // サンプル位置の色を計算
                  let samplePattern = sin(sampleUV.x * 10.0 + time) * sin(sampleUV.y * 10.0 + time) * 0.5 + 0.5;
                  let sampleColor = mix(
                    vec3<f32>(0.2, 0.3, 0.8),
                    vec3<f32>(0.8, 0.2, 0.4),
                    samplePattern
                  );
                  
                  color += vec4<f32>(sampleColor, 1.0) * weight;
                  totalWeight += weight;
                }
              }
              
              if (totalWeight > 0.0) {
                color /= totalWeight;
              } else {
                color = vec4<f32>(baseColor, 1.0);
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
    <div className="w-full h-full space-y-4">
      <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
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

      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        width={800}
        height={600}
      />
    </div>
  );
}
