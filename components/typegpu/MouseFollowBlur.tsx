"use client";

import { useEffect, useRef, useState } from "react";
import { initTypeGPU } from "@/lib/typegpu-setup";
import { setupMouseTracking, MousePosition } from "@/lib/mouse-tracking";

// シェーダーファイルをインポート
import { blurComputeShader } from "@/shaders/mouse-follow-blur-compute";
import { sceneFragmentShader } from "@/shaders/mouse-follow-blur-scene";
import { displayFragmentShader } from "@/shaders/mouse-follow-blur-display";
import { vertexShader } from "@/shaders/common-vertex";

// WebGPU公式サンプルの定数
const TILE_DIM = 128;
const BATCH = [4, 4];

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

        const canvasWidth = 800;
        const canvasHeight = 600;

        // サンプラー（WebGPU公式サンプルと同様）
        const sampler = device.createSampler({
          magFilter: "linear",
          minFilter: "linear",
        });

        // テクスチャを作成（WebGPU公式サンプルと同様）
        const sceneTexture = device.createTexture({
          size: { width: canvasWidth, height: canvasHeight },
          format: "rgba8unorm",
          usage:
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.RENDER_ATTACHMENT |
            GPUTextureUsage.COPY_DST,
        });

        const textures = [0, 1].map(() => {
          return device.createTexture({
            size: { width: canvasWidth, height: canvasHeight },
            format: "rgba8unorm",
            usage:
              GPUTextureUsage.COPY_DST |
              GPUTextureUsage.STORAGE_BINDING |
              GPUTextureUsage.TEXTURE_BINDING,
          });
        });

        // フリップバッファ（WebGPU公式サンプルと同様）
        const buffer0 = (() => {
          const buffer = device.createBuffer({
            size: 4,
            mappedAtCreation: true,
            usage: GPUBufferUsage.UNIFORM,
          });
          new Uint32Array(buffer.getMappedRange())[0] = 0;
          buffer.unmap();
          return buffer;
        })();

        const buffer1 = (() => {
          const buffer = device.createBuffer({
            size: 4,
            mappedAtCreation: true,
            usage: GPUBufferUsage.UNIFORM,
          });
          new Uint32Array(buffer.getMappedRange())[0] = 1;
          buffer.unmap();
          return buffer;
        })();

        // ブラーパラメータバッファ（WebGPU公式サンプルと同様）
        const blurParamsBuffer = device.createBuffer({
          size: 8, // Params struct: i32 + u32 = 4 + 4 = 8 bytes
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
        });

        // マウスパラメータバッファ
        const mouseParamsBuffer = device.createBuffer({
          size: 16, // MouseParams struct: vec2<f32> + f32 + f32 = 8 + 4 + 4 = 16 bytes
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
        });

        // シーン描画パイプライン（背景とテキストを描画）
        const scenePipeline = device.createRenderPipeline({
          label: "Scene render pipeline",
          layout: "auto",
          vertex: {
            module: device.createShaderModule({
              code: vertexShader,
            }),
            entryPoint: "vertexMain",
          },
          fragment: {
            module: device.createShaderModule({
              code: sceneFragmentShader,
            }),
            entryPoint: "sceneFragment",
            targets: [{ format: "rgba8unorm" }],
          },
          primitive: {
            topology: "triangle-strip",
          },
        });

        // コンピュートパイプライン（ブラー適用）
        const blurPipeline = device.createComputePipeline({
          label: "Blur compute pipeline",
          layout: "auto",
          compute: {
            module: device.createShaderModule({
              code: blurComputeShader,
            }),
            entryPoint: "main",
          },
        });

        // 表示パイプライン（結果を画面に表示）
        const displayPipeline = device.createRenderPipeline({
          label: "Display render pipeline",
          layout: "auto",
          vertex: {
            module: device.createShaderModule({
              code: vertexShader,
            }),
            entryPoint: "vertexMain",
          },
          fragment: {
            module: device.createShaderModule({
              code: displayFragmentShader,
            }),
            entryPoint: "displayFragment",
            targets: [{ format }],
          },
          primitive: {
            topology: "triangle-strip",
          },
        });

        // ブラーパラメータを更新
        const filterSize = 15;
        const blockDim = TILE_DIM - filterSize;
        const updateBlurParams = () => {
          device.queue.writeBuffer(
            blurParamsBuffer,
            0,
            new Uint32Array([filterSize + 1, blockDim])
          );
        };
        updateBlurParams();

        // バインドグループ（WebGPU公式サンプルと同様）
        const computeConstants = device.createBindGroup({
          layout: blurPipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: sampler },
            { binding: 1, resource: { buffer: blurParamsBuffer } },
            { binding: 2, resource: { buffer: mouseParamsBuffer } },
          ],
        });

        const computeBindGroup0 = device.createBindGroup({
          layout: blurPipeline.getBindGroupLayout(1),
          entries: [
            { binding: 1, resource: sceneTexture.createView() },
            { binding: 2, resource: textures[0].createView() },
            { binding: 3, resource: { buffer: buffer0 } },
          ],
        });

        const computeBindGroup1 = device.createBindGroup({
          layout: blurPipeline.getBindGroupLayout(1),
          entries: [
            { binding: 1, resource: textures[0].createView() },
            { binding: 2, resource: textures[1].createView() },
            { binding: 3, resource: { buffer: buffer1 } },
          ],
        });

        const displayBindGroup = device.createBindGroup({
          layout: displayPipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: sampler },
            { binding: 1, resource: textures[1].createView() },
          ],
        });

        // マウストラッキング設定
        const cleanupMouse = setupMouseTracking(canvas, (position) => {
          setMousePosition(position);
        });

        const render = () => {
          // マウスパラメータを更新
          const mouseParams = new Float32Array([
            mousePosition.x,
            mousePosition.y,
            0.2, // maxRadius
            2.0, // decayFactor
          ]);
          device.queue.writeBuffer(mouseParamsBuffer, 0, mouseParams);

          const commandEncoder = device.createCommandEncoder();

          // 1. シーンを描画（背景とテキスト）
          const scenePass = commandEncoder.beginRenderPass({
            colorAttachments: [
              {
                view: sceneTexture.createView(),
                clearValue: { r: 0.05, g: 0.05, b: 0.1, a: 1.0 },
                loadOp: "clear",
                storeOp: "store",
              },
            ],
          });
          scenePass.setPipeline(scenePipeline);
          scenePass.draw(4);
          scenePass.end();

          // 2. コンピュートパスでブラーを適用（WebGPU公式サンプルと同様）
          const computePass = commandEncoder.beginComputePass();
          computePass.setPipeline(blurPipeline);
          computePass.setBindGroup(0, computeConstants);

          // 水平方向のブラー
          computePass.setBindGroup(1, computeBindGroup0);
          computePass.dispatchWorkgroups(
            Math.ceil(canvasWidth / blockDim),
            Math.ceil(canvasHeight / BATCH[1])
          );

          // 垂直方向のブラー
          computePass.setBindGroup(1, computeBindGroup1);
          computePass.dispatchWorkgroups(
            Math.ceil(canvasHeight / blockDim),
            Math.ceil(canvasWidth / BATCH[1])
          );

          computePass.end();

          // 3. 結果を画面に表示
          const displayPass = commandEncoder.beginRenderPass({
            colorAttachments: [
              {
                view: context.getCurrentTexture().createView(),
                clearValue: { r: 0.05, g: 0.05, b: 0.1, a: 1.0 },
                loadOp: "clear",
                storeOp: "store",
              },
            ],
          });
          displayPass.setPipeline(displayPipeline);
          displayPass.setBindGroup(0, displayBindGroup);
          displayPass.draw(6);
          displayPass.end();

          device.queue.submit([commandEncoder.finish()]);
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
