// WebGPU公式サンプルのblur.wgslをベースにしたコンピュートシェーダー
// https://github.com/webgpu/webgpu-samples/blob/main/sample/imageBlur/blur.wgsl

export const blurComputeShader = `
struct Params {
  filterDim : i32,
  blockDim : u32,
}

struct MouseParams {
  mousePos : vec2<f32>,
  maxRadius : f32,
  decayFactor : f32,
}

@group(0) @binding(0) var samp : sampler;
@group(0) @binding(1) var<uniform> params : Params;
@group(0) @binding(2) var<uniform> mouseParams : MouseParams;
@group(1) @binding(1) var inputTex : texture_2d<f32>;
@group(1) @binding(2) var outputTex : texture_storage_2d<rgba8unorm, write>;

struct Flip {
  value : u32,
}
@group(1) @binding(3) var<uniform> flip : Flip;

// ワークグループ共有メモリ（WebGPU公式サンプルと同様）
var<workgroup> tile : array<array<vec3f, 128>, 4>;

@compute @workgroup_size(32, 1, 1)
fn main(
  @builtin(workgroup_id) WorkGroupID : vec3u,
  @builtin(local_invocation_id) LocalInvocationID : vec3u
) {
  let filterOffset = (params.filterDim - 1) / 2;
  let dims = vec2i(textureDimensions(inputTex, 0));
  let baseIndex = vec2i(WorkGroupID.xy * vec2(params.blockDim, 4) +
                            LocalInvocationID.xy * vec2(4, 1))
                  - vec2(filterOffset, 0);

  // テクスチャからデータを読み込む（WebGPU公式サンプルと同様）
  for (var r = 0; r < 4; r++) {
    for (var c = 0; c < 4; c++) {
      var loadIndex = baseIndex + vec2(c, r);
      if (flip.value != 0u) {
        loadIndex = loadIndex.yx;
      }

      tile[r][4 * LocalInvocationID.x + u32(c)] = textureSampleLevel(
        inputTex,
        samp,
        (vec2f(loadIndex) + vec2f(0.5, 0.5)) / vec2f(dims),
        0.0
      ).rgb;
    }
  }

  workgroupBarrier();

  // ブラーを適用（WebGPU公式サンプルと同様）
  for (var r = 0; r < 4; r++) {
    for (var c = 0; c < 4; c++) {
      var writeIndex = baseIndex + vec2(c, r);
      if (flip.value != 0) {
        writeIndex = writeIndex.yx;
      }

      let center = i32(4 * LocalInvocationID.x) + c;
      if (center >= filterOffset &&
          center < 128 - filterOffset &&
          all(writeIndex < dims)) {
        // マウス位置からの距離を計算（UV座標系）
        let uv = (vec2f(writeIndex) + vec2f(0.5, 0.5)) / vec2f(dims);
        let dist = distance(uv, mouseParams.mousePos);
        
        // 距離に基づいてブラー強度を計算（ガウシアン減衰）
        var blurIntensity = 0.0;
        if (dist < mouseParams.maxRadius) {
          let normalizedDist = dist / mouseParams.maxRadius;
          blurIntensity = exp(-normalizedDist * normalizedDist * mouseParams.decayFactor);
        }
        
        // ブラー強度に基づいてフィルターサイズを調整
        var effectiveFilterDim = params.filterDim;
        if (blurIntensity < 0.1) {
          // ブラー強度が低い場合はフィルターサイズを小さく
          effectiveFilterDim = max(3, i32(f32(params.filterDim) * blurIntensity * 10.0));
          if (effectiveFilterDim % 2 == 0) {
            effectiveFilterDim = effectiveFilterDim + 1;
          }
        }
        
        var acc = vec3(0.0, 0.0, 0.0);
        let effectiveFilterOffset = (effectiveFilterDim - 1) / 2;
        
        // ボックスフィルターを適用（WebGPU公式サンプルと同様）
        for (var f = 0; f < effectiveFilterDim; f++) {
          var i = center + f - effectiveFilterOffset;
          if (i >= 0 && i < 128) {
            acc = acc + (1.0 / f32(effectiveFilterDim)) * tile[r][i];
          }
        }
        
        textureStore(outputTex, writeIndex, vec4(acc, 1.0));
      }
    }
  }
}
`;

