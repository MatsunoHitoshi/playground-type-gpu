// 背景とテキストを描画するフラグメントシェーダー

export const sceneFragmentShader = `
@fragment
fn sceneFragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  // グラデーション背景
  var baseColor = mix(
    vec3<f32>(0.2, 0.3, 0.8),
    vec3<f32>(0.8, 0.2, 0.4),
    uv.x
  );
  
  // シンプルな文字描画関数（"BLUR"を描画）
  let charSize = vec2<f32>(0.06, 0.1);
  let spacing = 0.08;
  let textPos = vec2<f32>(0.2, 0.4);
  
  let char0UV = (uv - textPos) / charSize; // B
  let char1UV = (uv - textPos - vec2<f32>(spacing, 0.0)) / charSize; // L
  let char2UV = (uv - textPos - vec2<f32>(spacing * 2.0, 0.0)) / charSize; // U
  let char3UV = (uv - textPos - vec2<f32>(spacing * 3.0, 0.0)) / charSize; // R
  
  var textMask = 0.0;
  
  if (char0UV.x >= 0.0 && char0UV.x < 1.0 && char0UV.y >= 0.0 && char0UV.y < 1.0) {
    if ((char0UV.x < 0.15) || (char0UV.y < 0.15 && char0UV.x < 0.85) || 
        (char0UV.y > 0.4 && char0UV.y < 0.6 && char0UV.x < 0.85) || 
        (char0UV.y > 0.85 && char0UV.x < 0.85) || 
        (char0UV.x > 0.7 && char0UV.x < 0.85)) {
      textMask = 1.0;
    }
  }
  
  if (char1UV.x >= 0.0 && char1UV.x < 1.0 && char1UV.y >= 0.0 && char1UV.y < 1.0) {
    if ((char1UV.x < 0.15) || (char1UV.y > 0.85 && char1UV.x < 0.85)) {
      textMask = 1.0;
    }
  }
  
  if (char2UV.x >= 0.0 && char2UV.x < 1.0 && char2UV.y >= 0.0 && char2UV.y < 1.0) {
    if ((char2UV.x < 0.15) || (char2UV.x > 0.7 && char2UV.x < 0.85) || 
        (char2UV.y > 0.85 && char2UV.x < 0.85)) {
      textMask = 1.0;
    }
  }
  
  if (char3UV.x >= 0.0 && char3UV.x < 1.0 && char3UV.y >= 0.0 && char3UV.y < 1.0) {
    if ((char3UV.x < 0.15) || (char3UV.y < 0.15 && char3UV.x < 0.85) || 
        (char3UV.y > 0.4 && char3UV.y < 0.6 && char3UV.x < 0.85) || 
        (char3UV.x > 0.7 && char3UV.x < 0.85 && char3UV.y < 0.5) || 
        (char3UV.x > 0.5 && char3UV.y > 0.5 && abs(char3UV.x - char3UV.y + 0.3) < 0.1)) {
      textMask = 1.0;
    }
  }
  
  if (textMask > 0.5) {
    baseColor = vec3<f32>(1.0, 1.0, 1.0); // 白い文字
  }
  
  return vec4<f32>(baseColor, 1.0);
}
`;
