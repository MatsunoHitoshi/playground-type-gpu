"use client";

import { useEffect, useRef, useState } from "react";
import { initTypeGPU } from "@/lib/typegpu-setup";

export function BlurEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
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
          label: "Blur vertex shader",
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

        // フラグメントシェーダー（ブラー効果）
        const fragmentShader = device.createShaderModule({
          label: "Blur fragment shader",
          code: `
            @group(0) @binding(0) var<uniform> blurParams: vec2<f32>; // radius, intensity

            @fragment
            fn blurFragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
              let radius = blurParams.x;
              let intensity = blurParams.y;
              
              // ガウシアンブラーのサンプリング
              var color = vec4<f32>(0.0);
              var totalWeight = 0.0;
              
              let samples = 16u;
              for (var i = 0u; i < samples; i++) {
                let angle = f32(i) / f32(samples) * 6.28318; // 2 * PI
                let offset = vec2<f32>(cos(angle), sin(angle)) * radius;
                let sampleUV = uv + offset * 0.01;
                
                if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
                  let dist = length(offset);
                  let weight = exp(-dist * dist / (2.0 * intensity * intensity));
                  
                  // グラデーション背景
                  let baseColor = mix(
                    vec3<f32>(0.2, 0.3, 0.8),
                    vec3<f32>(0.8, 0.2, 0.4),
                    sampleUV.x
                  );
                  
                  color += vec4<f32>(baseColor, 1.0) * weight;
                  totalWeight += weight;
                }
              }
              
              color /= totalWeight;
              return color;
            }
          `,
        });

        // レンダーパイプライン
        const pipeline = device.createRenderPipeline({
          label: "Blur pipeline",
          layout: "auto",
          vertex: {
            module: vertexShader,
            entryPoint: "vertexMain",
          },
          fragment: {
            module: fragmentShader,
            entryPoint: "blurFragment",
            targets: [{ format }],
          },
          primitive: {
            topology: "triangle-strip",
          },
        });

        // ユニフォームバッファ
        const uniformBuffer = device.createBuffer({
          size: 8, // vec2<f32> = 8 bytes
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const startTime = Date.now();

        const render = () => {
          const currentTime = (Date.now() - startTime) / 1000.0;

          // 動的なブラー半径
          const radius = Math.sin(currentTime * 0.5) * 0.05 + 0.1;
          const intensity = Math.sin(currentTime * 0.3) * 0.02 + 0.03;

          const params = new Float32Array([radius, intensity]);
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
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-800 dark:text-red-200">Error: {error}</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded-lg"
      width={800}
      height={600}
    />
  );
}
