"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { initTypeGPU } from "@/lib/typegpu-setup";
import { setupMouseTracking, MousePosition } from "@/lib/mouse-tracking";

interface BlurZone {
  id: string;
  position: MousePosition;
  radius: number;
  intensity: number;
  isDragging: boolean;
}

const MAX_ZONES = 10;

export function InteractiveBlurZones() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [zones, setZones] = useState<BlurZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<MousePosition | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const handleClick = useCallback(
    (position: MousePosition) => {
      // 既存のゾーンをクリックしたかチェック
      const clickedZone = zones.find(
        (zone) =>
          Math.sqrt(
            Math.pow(zone.position.x - position.x, 2) +
              Math.pow(zone.position.y - position.y, 2)
          ) < zone.radius
      );

      if (clickedZone) {
        setSelectedZoneId(clickedZone.id);
        setIsDragging(true);
        dragStartRef.current = position;
      } else if (zones.length < MAX_ZONES) {
        // 新しいゾーンを追加
        const newZone: BlurZone = {
          id: `zone-${Date.now()}`,
          position,
          radius: 0.15,
          intensity: 1.0,
          isDragging: false,
        };
        setZones((prev) => [...prev, newZone]);
        setSelectedZoneId(newZone.id);
      }
    },
    [zones]
  );

  const handleMove = useCallback(
    (position: MousePosition) => {
      if (isDragging && selectedZoneId && dragStartRef.current) {
        const deltaX = position.x - dragStartRef.current.x;
        const deltaY = position.y - dragStartRef.current.y;

        setZones((prev) =>
          prev.map((zone) => {
            if (zone.id === selectedZoneId) {
              return {
                ...zone,
                position: {
                  x: Math.max(0, Math.min(1, zone.position.x + deltaX)),
                  y: Math.max(0, Math.min(1, zone.position.y + deltaY)),
                },
              };
            }
            return zone;
          })
        );
        dragStartRef.current = position;
      }
    },
    [isDragging, selectedZoneId]
  );

  const handleUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
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
          label: "InteractiveBlurZones vertex shader",
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

        // フラグメントシェーダー（インタラクティブブラーゾーン）
        const fragmentShader = device.createShaderModule({
          label: "InteractiveBlurZones fragment shader",
          code: `
            struct BlurZone {
              position: vec2<f32>,
              radius: f32,
              intensity: f32,
            }

            @group(0) @binding(0) var<storage, read> blurZones: array<BlurZone, 10>;
            @group(0) @binding(1) var<uniform> params: vec2<f32>; // zoneCount, time

            // シンプルな文字描画関数（"ZONES"を描画）
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
            fn interactiveBlurZonesFragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
              let zoneCount = u32(params.x);
              let time = params.y;
              
              // 背景パターン
              let pattern = sin(uv.x * 6.0 + time) * sin(uv.y * 6.0 + time) * 0.5 + 0.5;
              let baseColor = mix(
                vec3<f32>(0.15, 0.25, 0.6),
                vec3<f32>(0.6, 0.15, 0.35),
                pattern
              );
              
              // 全ゾーンのブラー効果を合成
              var totalBlur = 0.0;
              var totalWeight = 0.0;
              var highlight = 0.0;
              
              for (var i = 0u; i < zoneCount; i++) {
                let zone = blurZones[i];
                let dist = distance(uv, zone.position);
                
                if (dist < zone.radius) {
                  // ガウシアン減衰
                  let normalizedDist = dist / zone.radius;
                  let weight = exp(-normalizedDist * normalizedDist * 3.0) * zone.intensity;
                  
                  totalBlur += weight;
                  totalWeight += weight;
                  
                  // ゾーン中心に近いほど明るく
                  if (dist < zone.radius * 0.3) {
                    highlight += (1.0 - normalizedDist * 3.0) * zone.intensity;
                  }
                }
              }
              
              // ブラー効果を適用
              var color = vec4<f32>(0.0);
              var sampleWeight = 0.0;
              
              let blurAmount = totalBlur * 0.12;
              let samples = 16u;
              
              for (var i = 0u; i < samples; i++) {
                let angle = f32(i) / f32(samples) * 6.28318;
                let offset = vec2<f32>(cos(angle), sin(angle)) * blurAmount;
                let sampleUV = uv + offset;
                
                if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
                  let offsetDist = length(offset);
                  let weight = exp(-offsetDist * offsetDist / (2.0 * blurAmount * blurAmount + 0.001));
                  
                  let samplePattern = sin(sampleUV.x * 6.0 + time) * sin(sampleUV.y * 6.0 + time) * 0.5 + 0.5;
                  var sampleColor = mix(
                    vec3<f32>(0.15, 0.25, 0.6),
                    vec3<f32>(0.6, 0.15, 0.35),
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
              color = vec4<f32>(color.rgb + vec3<f32>(highlight * 0.4), color.a);
              
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
          label: "InteractiveBlurZones pipeline",
          layout: "auto",
          vertex: {
            module: vertexShader,
            entryPoint: "vertexMain",
          },
          fragment: {
            module: fragmentShader,
            entryPoint: "interactiveBlurZonesFragment",
            targets: [{ format }],
          },
          primitive: {
            topology: "triangle-strip",
          },
        });

        // ストレージバッファ（ブラーゾーン用）
        const zoneBufferSize = MAX_ZONES * 16; // vec2<f32> (8) + f32 (4) + f32 (4) = 16 bytes per zone
        const zoneBuffer = device.createBuffer({
          size: zoneBufferSize,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        // ユニフォームバッファ
        const uniformBuffer = device.createBuffer({
          size: 8, // vec2<f32> = 8 bytes
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // マウストラッキング設定
        const cleanupMouse = setupMouseTracking(
          canvas,
          handleMove,
          handleClick,
          handleUp
        );

        const startTime = Date.now();

        const render = () => {
          const currentTime = (Date.now() - startTime) / 1000.0;

          // ゾーンデータをバッファに書き込む
          const zoneData = new Float32Array(MAX_ZONES * 4);
          for (let i = 0; i < MAX_ZONES; i++) {
            const zone = zones[i];
            if (zone) {
              zoneData[i * 4 + 0] = zone.position.x;
              zoneData[i * 4 + 1] = zone.position.y;
              zoneData[i * 4 + 2] = zone.radius;
              zoneData[i * 4 + 3] = zone.intensity;
            } else {
              zoneData[i * 4 + 0] = -1.0;
              zoneData[i * 4 + 1] = -1.0;
              zoneData[i * 4 + 2] = 0.0;
              zoneData[i * 4 + 3] = 0.0;
            }
          }
          device.queue.writeBuffer(zoneBuffer, 0, zoneData);

          // パラメータを更新
          const params = new Float32Array([zones.length, currentTime]);
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
                resource: { buffer: zoneBuffer },
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
  }, [zones, handleClick, handleMove, handleUp]);

  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-800 dark:text-red-200">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full space-y-4">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg cursor-pointer"
        width={800}
        height={600}
      />
      <div className="space-y-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          クリック/タップでゾーンを追加、ドラッグで移動（最大{MAX_ZONES}個）
        </div>
        {selectedZone && (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              選択中のゾーン
            </h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  半径: {selectedZone.radius.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.3"
                  step="0.01"
                  value={selectedZone.radius}
                  onChange={(e) =>
                    setZones((prev) =>
                      prev.map((z) =>
                        z.id === selectedZoneId
                          ? { ...z, radius: Number(e.target.value) }
                          : z
                      )
                    )
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  強度: {selectedZone.intensity.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={selectedZone.intensity}
                  onChange={(e) =>
                    setZones((prev) =>
                      prev.map((z) =>
                        z.id === selectedZoneId
                          ? { ...z, intensity: Number(e.target.value) }
                          : z
                      )
                    )
                  }
                  className="w-full"
                />
              </div>
              <button
                onClick={() => {
                  setZones((prev) =>
                    prev.filter((z) => z.id !== selectedZoneId)
                  );
                  setSelectedZoneId(null);
                }}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                このゾーンを削除
              </button>
            </div>
          </div>
        )}
        {zones.length > 0 && (
          <button
            onClick={() => {
              setZones([]);
              setSelectedZoneId(null);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            すべてクリア
          </button>
        )}
      </div>
    </div>
  );
}
