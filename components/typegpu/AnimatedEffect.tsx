"use client";

import { useEffect, useRef, useState } from "react";
import { initTypeGPU } from "@/lib/typegpu-setup";

export function AnimatedEffect() {
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
          label: "Animated vertex shader",
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

        // フラグメントシェーダー（アニメーション）
        const fragmentShader = device.createShaderModule({
          label: "Animated fragment shader",
          code: `
            @group(0) @binding(0) var<uniform> time: f32;

            @fragment
            fn animatedFragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
              // 動的なブラー効果
              let center = vec2<f32>(0.5, 0.5);
              let dist = length(uv - center);
              
              // 時間に基づく動的なブラー半径
              let blurRadius = sin(time * 2.0) * 0.1 + 0.15;
              let blur = smoothstep(blurRadius - 0.05, blurRadius + 0.05, dist);
              
              // 色のアニメーション
              let hue = time * 0.5;
              let r = sin(hue) * 0.5 + 0.5;
              let g = sin(hue + 2.094) * 0.5 + 0.5; // 120度
              let b = sin(hue + 4.189) * 0.5 + 0.5; // 240度
              
              let color = vec3<f32>(r, g, b);
              
              // ブラーと色を組み合わせ
              let finalColor = mix(color, vec3<f32>(0.5), blur);
              
              return vec4<f32>(finalColor, 1.0);
            }
          `,
        });

        // レンダーパイプライン
        const pipeline = device.createRenderPipeline({
          label: "Animated pipeline",
          layout: "auto",
          vertex: {
            module: vertexShader,
            entryPoint: "vertexMain",
          },
          fragment: {
            module: fragmentShader,
            entryPoint: "animatedFragment",
            targets: [{ format }],
          },
          primitive: {
            topology: "triangle-strip",
          },
        });

        // ユニフォームバッファ
        const uniformBuffer = device.createBuffer({
          size: 4, // f32 = 4 bytes
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const startTime = Date.now();

        const render = () => {
          const currentTime = (Date.now() - startTime) / 1000.0;

          const timeData = new Float32Array([currentTime]);
          device.queue.writeBuffer(uniformBuffer, 0, timeData);

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
