"use client";

import { useEffect, useRef, useState } from "react";
import { initTypeGPU } from "@/lib/typegpu-setup";
import { setupMouseTracking, MousePosition } from "@/lib/mouse-tracking";

export function MouseFollowBlur() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0.5,
    y: 0.5,
  });
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
          label: "MouseFollowBlur vertex shader",
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

        // フラグメントシェーダー（マウス追従型ブラー）
        const fragmentShader = device.createShaderModule({
          label: "MouseFollowBlur fragment shader",
          code: `
            @group(0) @binding(0) var<uniform> params: vec4<f32>; // mouseX, mouseY, maxRadius, decayFactor

            @fragment
            fn mouseFollowBlurFragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
              let mousePos = params.xy;
              let maxRadius = params.z;
              let decayFactor = params.w;
              
              // マウス位置からの距離を計算
              let dist = distance(uv, mousePos);
              
              // 距離に基づいてブラー強度を計算（ガウシアン減衰）
              var blurIntensity = 0.0;
              if (dist < maxRadius) {
                let normalizedDist = dist / maxRadius;
                blurIntensity = exp(-normalizedDist * normalizedDist * decayFactor);
              }
              
              // ブラー効果を適用（サンプリング）
              var color = vec4<f32>(0.0);
              var totalWeight = 0.0;
              
              let samples = 16u;
              let blurRadius = blurIntensity * 0.1;
              
              for (var i = 0u; i < samples; i++) {
                let angle = f32(i) / f32(samples) * 6.28318; // 2 * PI
                let offset = vec2<f32>(cos(angle), sin(angle)) * blurRadius;
                let sampleUV = uv + offset;
                
                if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
                  let sampleDist = length(offset);
                  let weight = exp(-sampleDist * sampleDist / (2.0 * 0.01));
                  
                  // グラデーション背景
                  var baseColor = mix(
                    vec3<f32>(0.2, 0.3, 0.8),
                    vec3<f32>(0.8, 0.2, 0.4),
                    sampleUV.x
                  );
                  
                  // マウス位置に近いほど明るく
                  let mouseDist = distance(sampleUV, mousePos);
                  let highlight = 1.0 - smoothstep(0.0, 0.3, mouseDist);
                  baseColor += vec3<f32>(highlight * 0.5);
                  
                  color += vec4<f32>(baseColor, 1.0) * weight;
                  totalWeight += weight;
                }
              }
              
              if (totalWeight > 0.0) {
                color /= totalWeight;
              } else {
                // フォールバック
                let baseColor = mix(
                  vec3<f32>(0.2, 0.3, 0.8),
                  vec3<f32>(0.8, 0.2, 0.4),
                  uv.x
                );
                color = vec4<f32>(baseColor, 1.0);
              }
              
              return color;
            }
          `,
        });

        // レンダーパイプライン
        const pipeline = device.createRenderPipeline({
          label: "MouseFollowBlur pipeline",
          layout: "auto",
          vertex: {
            module: vertexShader,
            entryPoint: "vertexMain",
          },
          fragment: {
            module: fragmentShader,
            entryPoint: "mouseFollowBlurFragment",
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

        // マウストラッキング設定
        const cleanupMouse = setupMouseTracking(canvas, (position) => {
          setMousePosition(position);
        });

        const render = () => {
          // パラメータを更新
          const params = new Float32Array([
            mousePosition.x,
            mousePosition.y,
            0.2, // maxRadius
            2.0, // decayFactor
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
  }, [mousePosition]);

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
        className="w-full h-full rounded-lg cursor-none"
        width={800}
        height={600}
      />
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        マウスを動かすと、その位置にブラー効果が追従します
      </div>
    </div>
  );
}
