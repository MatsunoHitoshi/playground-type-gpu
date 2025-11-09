// アニメーション対応のフラグメントシェーダー
@fragment
fn animatedFragment(
  @location(0) uv: vec2<f32>,
  @location(1) time: f32,
) -> @location(0) vec4<f32> {
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


