"use client";

import { useEffect, useRef, useState } from "react";
import { initTypeGPU } from "@/lib/typegpu-setup";
import { setupMouseTracking, MousePosition } from "@/lib/mouse-tracking";

export function DepthBasedBlur() {
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
          label: "DepthBasedBlur vertex shader",
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

        // フラグメントシェーダー（深度感ブラー）
        const fragmentShader = device.createShaderModule({
          label: "DepthBasedBlur fragment shader",
          code: `
            @group(0) @binding(0) var<uniform> params: vec4<f32>; // mouseX, mouseY, minDepth, maxDepth
            @group(0) @binding(1) var<uniform> depthParams: vec3<f32>; // maxBlurRadius, time, intensity

            // シンプルな文字描画関数（"DEPTH"を描画）
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
            fn depthBasedBlurFragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
              let mousePos = params.xy;
              let minDepth = params.z;
              let maxDepth = params.w;
              let maxBlurRadius = depthParams.x;
              let time = depthParams.y;
              let intensity = depthParams.z;
              
              // マウス位置からの距離を計算（深度値）
              let dist = distance(uv, mousePos);
              
              // 深度値を正規化（0.0-1.0）
              let normalizedDepth = clamp((dist - minDepth) / (maxDepth - minDepth), 0.0, 1.0);
              
              // 深度に基づいてブラー強度を計算（遠いほどブラーが強い）
              let blurIntensity = normalizedDepth * intensity;
              let blurRadius = blurIntensity * maxBlurRadius;
              
              // 背景パターン（3D的な奥行き感を出すため、深度に応じて色を変える）
              let depthColor = mix(
                vec3<f32>(0.3, 0.4, 0.9), // 近距離（明るい）
                vec3<f32>(0.1, 0.1, 0.3)  // 遠距離（暗い）
              , normalizedDepth);
              
              let pattern = sin(uv.x * 10.0 + time) * sin(uv.y * 10.0 + time) * 0.3 + 0.7;
              let baseColor = mix(
                depthColor,
                depthColor * 0.5,
                pattern
              );
              
              // 深度ブラー効果を適用（TypeGPU公式Exampleに基づく実装）
              var color = vec4<f32>(0.0);
              var totalWeight = 0.0;
              
              // sigma値を正しく計算
              let sigma = blurRadius / 3.0;
              // サンプリング範囲を3*sigmaに制限
              let sampleRadius = sigma * 3.0;
              
              let samples = 24u;
              
              for (var i = 0u; i < samples; i++) {
                // 均一分布の角度
                let angle = f32(i) / f32(samples) * 6.28318; // 2 * PI
                // ガウシアン分布に基づく半径（より中心に近いサンプルを多く）
                let r = sqrt(f32(i) / f32(samples)) * sampleRadius;
                let offset = vec2<f32>(cos(angle), sin(angle)) * r;
                let sampleUV = uv + offset;
                
                if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
                  // サンプル位置の深度を計算
                  let sampleDist = distance(sampleUV, mousePos);
                  let sampleDepth = clamp((sampleDist - minDepth) / (maxDepth - minDepth), 0.0, 1.0);
                  
                  // ガウシアン重み（TypeGPU公式Exampleに基づく）
                  let offsetDist = length(offset);
                  let weight = exp(-offsetDist * offsetDist / (2.0 * sigma * sigma));
                  
                  // サンプル位置の色（深度に応じて）
                  let sampleDepthColor = mix(
                    vec3<f32>(0.3, 0.4, 0.9),
                    vec3<f32>(0.1, 0.1, 0.3),
                    sampleDepth
                  );
                  
                  let samplePattern = sin(sampleUV.x * 10.0 + time) * sin(sampleUV.y * 10.0 + time) * 0.3 + 0.7;
                  var sampleColor = mix(
                    sampleDepthColor,
                    sampleDepthColor * 0.5,
                    samplePattern
                  );
                  
                  // 文字を描画
                  let textPos = vec2<f32>(0.15, 0.45);
                  let textMask = drawText(sampleUV, textPos);
                  if (textMask > 0.5) {
                    sampleColor = vec3<f32>(1.0, 1.0, 1.0); // 白い文字
                  }
                  
                  // マウス位置に近いほど明るく（フォーカス効果）
                  let focusDist = distance(sampleUV, mousePos);
                  let focus = 1.0 - smoothstep(0.0, 0.15, focusDist);
                  sampleColor += vec3<f32>(focus * 0.4);
                  
                  color += vec4<f32>(sampleColor, 1.0) * weight;
                  totalWeight += weight;
                }
              }
              
              if (totalWeight > 0.0) {
                color /= totalWeight;
              } else {
                color = vec4<f32>(baseColor, 1.0);
              }
              
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
          label: "DepthBasedBlur pipeline",
          layout: "auto",
          vertex: {
            module: vertexShader,
            entryPoint: "vertexMain",
          },
          fragment: {
            module: fragmentShader,
            entryPoint: "depthBasedBlurFragment",
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

        const depthParamsBuffer = device.createBuffer({
          size: 12, // vec3<f32> = 12 bytes
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // マウストラッキング設定
        const cleanupMouse = setupMouseTracking(canvas, (position) => {
          setMousePosition(position);
        });

        const startTime = Date.now();

        const render = () => {
          const currentTime = (Date.now() - startTime) / 1000.0;

          // パラメータを更新
          const params = new Float32Array([
            mousePosition.x,
            mousePosition.y,
            0.0, // minDepth
            0.5, // maxDepth
          ]);
          device.queue.writeBuffer(uniformBuffer, 0, params);

          const depthParams = new Float32Array([
            0.15, // maxBlurRadius
            currentTime,
            1.0, // intensity
          ]);
          device.queue.writeBuffer(depthParamsBuffer, 0, depthParams);

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
              {
                binding: 1,
                resource: { buffer: depthParamsBuffer },
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
        マウス位置を中心に、距離に応じた深度ブラーが適用されます（遠いほどブラーが強くなります）
      </div>
    </div>
  );
}
