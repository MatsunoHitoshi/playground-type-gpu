// 結果を表示するフラグメントシェーダー

export const displayFragmentShader = `
@group(0) @binding(0) var samp : sampler;
@group(0) @binding(1) var inputTex : texture_2d<f32>;

@fragment
fn displayFragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return textureSampleLevel(inputTex, samp, uv, 0.0);
}
`;

