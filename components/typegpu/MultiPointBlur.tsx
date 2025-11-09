"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { initTypeGPU } from "@/lib/typegpu-setup";
import { setupMouseTracking, MousePosition } from "@/lib/mouse-tracking";

interface BlurPoint {
  position: MousePosition;
  radius: number;
  intensity: number;
}

const MAX_POINTS = 10;

export function MultiPointBlur() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<BlurPoint[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const handleClick = useCallback((position: MousePosition) => {
    setPoints((prev) => {
      if (prev.length >= MAX_POINTS) {
        // 最も古いポイントを削除
        return [...prev.slice(1), { position, radius: 0.1, intensity: 1.0 }];
      }
      return [...prev, { position, radius: 0.1, intensity: 1.0 }];
    });
  }, []);

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
          label: "MultiPointBlur vertex shader",
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

        // フラグメントシェーダー（マルチポイントブラー）
        const fragmentShader = device.createShaderModule({
          label: "MultiPointBlur fragment shader",
          code: `
            struct BlurPoint {
              position: vec2<f32>,  // offset 0, size 8
              radius: f32,          // offset 8, size 4
              intensity: f32,       // offset 12, size 4
            }

            @group(0) @binding(0) var<storage, read> blurPoints: array<BlurPoint, 10>;
            @group(0) @binding(1) var<uniform> params: vec2<f32>; // pointCount, time

            // シンプルな文字描画関数（"MULTI"を描画）
            fn drawText(uv: vec2<f32>, textPos: vec2<f32>) -> f32 {
              let charSize = vec2<f32>(0.05, 0.1);
              let spacing = 0.07;
              
              var result = 0.0;
              for (var i = 0u; i < 5u; i++) {
                let charUV = (uv - textPos - vec2<f32>(spacing * f32(i), 0.0)) / charSize;
                if (charUV.x >= 0.0 && charUV.x < 1.0 && charUV.y >= 0.0 && charUV.y < 1.0) {
                  if ((charUV.x < 0.15 || charUV.x > 0.85) || (charUV.y < 0.15 || charUV.y > 0.85)) {
                    result = 1.0;
                  }
                }
              }
              return result;
            }

            @fragment
            fn multiPointBlurFragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
              let pointCount = u32(params.x);
              let time = params.y;
              
              // 背景パターン
              let pattern = sin(uv.x * 8.0 + time) * sin(uv.y * 8.0 + time) * 0.5 + 0.5;
              let baseColor = mix(
                vec3<f32>(0.2, 0.3, 0.7),
                vec3<f32>(0.7, 0.2, 0.4),
                pattern
              );
              
              // 全ポイントのブラー効果を合成
              var totalBlur = 0.0;
              var totalWeight = 0.0;
              var highlight = 0.0;
              
              for (var i = 0u; i < pointCount; i++) {
                let point = blurPoints[i];
                let dist = distance(uv, point.position);
                
                if (dist < point.radius) {
                  // ガウシアン減衰
                  let normalizedDist = dist / point.radius;
                  let weight = exp(-normalizedDist * normalizedDist * 3.0) * point.intensity;
                  
                  totalBlur += weight;
                  totalWeight += weight;
                  
                  // ポイント位置に近いほど明るく
                  if (dist < point.radius * 0.3) {
                    highlight += (1.0 - normalizedDist * 3.0) * point.intensity;
                  }
                }
              }
              
              // ブラー効果を適用（TypeGPU公式Exampleに基づく実装）
              var color = vec4<f32>(0.0);
              var sampleWeight = 0.0;
              
              // ブラー半径をUV座標系に変換
              let blurAmount = totalBlur * 0.1;
              // sigma値を正しく計算
              let sigma = blurAmount / 3.0;
              // サンプリング範囲を3*sigmaに制限
              let sampleRadius = sigma * 3.0;
              
              let samples = 24u;
              
              for (var i = 0u; i < samples; i++) {
                // 均一分布の角度
                let angle = f32(i) / f32(samples) * 6.28318;
                // ガウシアン分布に基づく半径（より中心に近いサンプルを多く）
                let r = sqrt(f32(i) / f32(samples)) * sampleRadius;
                let offset = vec2<f32>(cos(angle), sin(angle)) * r;
                let sampleUV = uv + offset;
                
                if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
                  let offsetDist = length(offset);
                  // ガウシアン重み（TypeGPU公式Exampleに基づく）
                  let weight = exp(-offsetDist * offsetDist / (2.0 * sigma * sigma));
                  
                  let samplePattern = sin(sampleUV.x * 8.0 + time) * sin(sampleUV.y * 8.0 + time) * 0.5 + 0.5;
                  var sampleColor = mix(
                    vec3<f32>(0.2, 0.3, 0.7),
                    vec3<f32>(0.7, 0.2, 0.4),
                    samplePattern
                  );
                  
                  // 文字を描画
                  let textPos = vec2<f32>(0.15, 0.45);
                  let textMask = drawText(sampleUV, textPos);
                  if (textMask > 0.5) {
                    sampleColor = vec3<f32>(1.0, 1.0, 1.0); // 白い文字
                  }
                  
                  color += vec4<f32>(sampleColor, 1.0) * weight;
                  sampleWeight += weight;
                }
              }
              
              if (sampleWeight > 0.0) {
                color /= sampleWeight;
              } else {
                color = vec4<f32>(baseColor, 1.0);
              }
              
              // ハイライトを追加
              color = vec4<f32>(color.rgb + vec3<f32>(highlight * 0.5), color.a);
              
              // 最終的な色に文字を描画
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
          label: "MultiPointBlur pipeline",
          layout: "auto",
          vertex: {
            module: vertexShader,
            entryPoint: "vertexMain",
          },
          fragment: {
            module: fragmentShader,
            entryPoint: "multiPointBlurFragment",
            targets: [{ format }],
          },
          primitive: {
            topology: "triangle-strip",
          },
        });

        // ストレージバッファ（ブラーポイント用）
        const pointBufferSize = MAX_POINTS * 16; // vec2<f32> (8) + f32 (4) + f32 (4) = 16 bytes per point
        const pointBuffer = device.createBuffer({
          size: pointBufferSize,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        // ユニフォームバッファ
        const uniformBuffer = device.createBuffer({
          size: 8, // vec2<f32> = 8 bytes
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // マウストラッキング設定
        const cleanupMouse = setupMouseTracking(canvas, () => {}, handleClick);

        const startTime = Date.now();

        const render = () => {
          const currentTime = (Date.now() - startTime) / 1000.0;

          // ポイントデータをバッファに書き込む（16バイトアライメント）
          const pointData = new Float32Array(MAX_POINTS * 4); // vec2 + f32 + f32 = 4 floats per point (16 bytes)
          for (let i = 0; i < MAX_POINTS; i++) {
            const point = points[i];
            if (point) {
              pointData[i * 4 + 0] = point.position.x;
              pointData[i * 4 + 1] = point.position.y;
              pointData[i * 4 + 2] = point.radius;
              pointData[i * 4 + 3] = point.intensity;
            } else {
              pointData[i * 4 + 0] = -1.0; // 無効なポイント
              pointData[i * 4 + 1] = -1.0;
              pointData[i * 4 + 2] = 0.0;
              pointData[i * 4 + 3] = 0.0;
            }
          }
          device.queue.writeBuffer(pointBuffer, 0, pointData);

          // パラメータを更新
          const params = new Float32Array([points.length, currentTime]);
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
                resource: { buffer: pointBuffer },
              },
              {
                binding: 1,
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
          cleanupMouse();
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    init();
  }, [points, handleClick]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-800 dark:text-red-200">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg cursor-pointer"
        width={800}
        height={600}
      />
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        クリック/タップでブラーポイントを追加（最大{MAX_POINTS}個）
      </div>
      {points.length > 0 && (
        <button
          onClick={() => setPoints([])}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          すべてクリア
        </button>
      )}
    </div>
  );
}
