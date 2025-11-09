// ブラー表現のコンピュートシェーダー
@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<uniform> blurParams: vec2<f32>; // blurRadius, sigma

@compute @workgroup_size(8, 8)
fn blurCompute(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let size = textureDimensions(inputTexture);
  let coord = vec2<i32>(globalId.xy);
  
  if (coord.x >= i32(size.x) || coord.y >= i32(size.y)) {
    return;
  }
  
  let uv = vec2<f32>(coord) / vec2<f32>(size);
  let radius = i32(blurParams.x);
  let sigma = blurParams.y;
  
  var color = vec4<f32>(0.0);
  var totalWeight = 0.0;
  
  // ガウシアンブラー
  for (var x = -radius; x <= radius; x++) {
    for (var y = -radius; y <= radius; y++) {
      let offset = vec2<i32>(x, y);
      let sampleCoord = coord + offset;
      
      if (sampleCoord.x >= 0 && sampleCoord.x < i32(size.x) &&
          sampleCoord.y >= 0 && sampleCoord.y < i32(size.y)) {
        let dist = length(vec2<f32>(offset));
        let weight = exp(-(dist * dist) / (2.0 * sigma * sigma));
        
        let sampleColor = textureLoad(inputTexture, sampleCoord, 0);
        color += sampleColor * weight;
        totalWeight += weight;
      }
    }
  }
  
  color /= totalWeight;
  textureStore(outputTexture, coord, color);
}


