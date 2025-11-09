"use client";

import { useEffect, useRef, useState } from "react";
import { initTypeGPU } from "@/lib/typegpu-setup";
import {
  setupMouseTracking,
  MouseHistory,
  MousePosition,
} from "@/lib/mouse-tracking";

export function DirectionalMotionBlur() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const mouseHistoryRef = useRef<MouseHistory>(new MouseHistory(5));
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
          label: "DirectionalMotionBlur vertex shader",
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

        // フラグメントシェーダー（方向性モーションブラー）
        const fragmentShader = device.createShaderModule({
          label: "DirectionalMotionBlur fragment shader",
          code: `
            @group(0) @binding(0) var<uniform> params: vec4<f32>; // mouseX, mouseY, directionX, directionY
            @group(0) @binding(1) var<uniform> motionParams: vec3<f32>; // speed, blurIntensity, time

            @fragment
            fn directionalMotionBlurFragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
              let mousePos = params.xy;
              let direction = normalize(params.zw);
              let speed = motionParams.x;
              let blurIntensity = motionParams.y;
              let time = motionParams.z;
              
              // 背景パターン
              let pattern = sin(uv.x * 8.0 + time) * sin(uv.y * 8.0 + time) * 0.5 + 0.5;
              let baseColor = mix(
                vec3<f32>(0.1, 0.2, 0.6),
                vec3<f32>(0.6, 0.1, 0.3),
                pattern
              );
              
              // マウス位置からのベクトル
              let toMouse = uv - mousePos;
              let distToMouse = length(toMouse);
              
              // 方向性ブラー効果を適用
              var color = vec4<f32>(0.0);
              var totalWeight = 0.0;
              
              let samples = 20u;
              let motionBlurAmount = speed * blurIntensity * 0.15;
              
              for (var i = 0u; i < samples; i++) {
                // サンプリング位置を方向に沿って配置
                let t = (f32(i) / f32(samples) - 0.5) * 2.0;
                let offset = direction * t * motionBlurAmount;
                let sampleUV = uv + offset;
                
                if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
                  // 方向性重み（方向に沿ったサンプルほど重い）
                  let directionWeight = 1.0 - abs(t);
                  
                  // 距離による減衰
                  let sampleToMouse = sampleUV - mousePos;
                  let sampleDist = length(sampleToMouse);
                  let distanceWeight = exp(-sampleDist * sampleDist * 5.0);
                  
                  // ガウシアン重み
                  let gaussianWeight = exp(-(t * t) / 0.5);
                  
                  let weight = directionWeight * distanceWeight * gaussianWeight;
                  
                  // サンプル位置の色
                  let samplePattern = sin(sampleUV.x * 8.0 + time) * sin(sampleUV.y * 8.0 + time) * 0.5 + 0.5;
                  var sampleColor = mix(
                    vec3<f32>(0.1, 0.2, 0.6),
                    vec3<f32>(0.6, 0.1, 0.3),
                    samplePattern
                  );
                  
                  // マウス位置に近いほど明るく
                  let highlight = 1.0 - smoothstep(0.0, 0.2, sampleDist);
                  sampleColor += vec3<f32>(highlight * 0.3);
                  
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
          label: "DirectionalMotionBlur pipeline",
          layout: "auto",
          vertex: {
            module: vertexShader,
            entryPoint: "vertexMain",
          },
          fragment: {
            module: fragmentShader,
            entryPoint: "directionalMotionBlurFragment",
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

        const motionParamsBuffer = device.createBuffer({
          size: 12, // vec3<f32> = 12 bytes
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // マウストラッキング設定
        const cleanupMouse = setupMouseTracking(canvas, (position) => {
          mouseHistoryRef.current.add(position);
          setMousePosition(position);
        });

        const startTime = Date.now();

        const render = () => {
          const currentTime = (Date.now() - startTime) / 1000.0;

          // 速度と方向を計算
          const velocity = mouseHistoryRef.current.getVelocity();
          const direction = mouseHistoryRef.current.getDirection();
          const speed = mouseHistoryRef.current.getSpeed();

          // パラメータを更新
          const params = new Float32Array([
            mousePosition.x,
            mousePosition.y,
            direction.x,
            direction.y,
          ]);
          device.queue.writeBuffer(uniformBuffer, 0, params);

          const motionParams = new Float32Array([
            speed,
            1.0, // blurIntensity
            currentTime,
          ]);
          device.queue.writeBuffer(motionParamsBuffer, 0, motionParams);

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
                resource: { buffer: motionParamsBuffer },
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
        マウスを動かすと、移動方向に沿ってモーションブラーが適用されます
      </div>
    </div>
  );
}
