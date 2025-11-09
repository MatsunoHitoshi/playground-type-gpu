// 靄表現のフラグメントシェーダー
@fragment
fn fogFragment(
  @location(0) uv: vec2<f32>,
  @location(1) time: f32,
) -> @location(0) vec4<f32> {
  // ノイズベースの靄効果
  let noise = sin(uv.x * 10.0 + time) * sin(uv.y * 10.0 + time * 0.7);
  let fog = noise * 0.5 + 0.5;
  
  // 距離ベースのフェード
  let dist = length(uv - vec2<f32>(0.5, 0.5));
  let fade = 1.0 - smoothstep(0.3, 0.7, dist);
  
  // 靄の色（白っぽい）
  let fogColor = vec3<f32>(0.9, 0.9, 0.95) * fog * fade;
  
  return vec4<f32>(fogColor, fade * 0.8);
}


