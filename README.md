# TypeGPU Playground

TypeGPU を中心に技術を学びながら、Web での表現方法を模索する Playground プロジェクトです。

## 概要

このプロジェクトは、Next.js、TypeScript、TailwindCSS を基盤とし、TypeGPU（WebGPU/WGSL）を中心に、CSS filter/backdrop-filter、Canvas API も組み合わせて靄・ブラー表現とアニメーションを実装する Playground です。

## 技術スタック

- **Next.js 16** (App Router)
- **TypeScript**
- **TailwindCSS**
- **TypeGPU** - WebGPU API の型安全ラッパー
- **@webgpu/types** - WebGPU 型定義
- **WebGPU API** - WGSL シェーダー

## 機能

### TypeGPU / WebGPU

- 靄表現 (Fog Effect) - ノイズベースの靄効果
- ブラー表現 (Blur Effect) - ガウシアンブラー効果
- アニメーション効果 - 時間に基づく動的な色とブラーの組み合わせ

### CSS Filter

- `filter: blur()` - 要素全体にブラーを適用
- `backdrop-filter: blur()` - 背景にブラーを適用
- 動的なブラー強度の調整

### Canvas API

- Canvas 2D API を使ったブラー表現
- アニメーションループ
- リアルタイムでのブラー強度の調整

## セットアップ

### 必要な環境

- Node.js 20.9.0 以上
- WebGPU をサポートするブラウザ（Chrome 113+, Edge 113+, Safari 18+）

### インストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## プロジェクト構造

```text
playground-type-gpu/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (メインPlayground)
│   ├── typegpu/
│   │   ├── page.tsx (TypeGPU基本サンプル)
│   │   ├── fog/
│   │   │   └── page.tsx (靄表現)
│   │   └── blur/
│   │       └── page.tsx (ブラー表現)
│   ├── css/
│   │   └── page.tsx (CSS filterサンプル)
│   └── canvas/
│       └── page.tsx (Canvas APIサンプル)
├── components/
│   ├── typegpu/
│   │   ├── FogEffect.tsx
│   │   ├── BlurEffect.tsx
│   │   └── AnimatedEffect.tsx
│   ├── css/
│   │   └── BlurEffect.tsx
│   ├── canvas/
│   │   └── CanvasBlur.tsx
│   └── common/
│       └── WebGPUCheck.tsx
├── shaders/
│   ├── fog.wgsl
│   ├── blur.wgsl
│   └── animated.wgsl
└── lib/
    └── typegpu-setup.ts
```

## 参考資料

- [TypeGPU 公式ドキュメント](https://docs.swmansion.com/TypeGPU/)
- [TypeGPU 入門 (Zenn)](https://zenn.dev/emadurandal/books/e5a5db5066ec17/viewer/intro)
- [WebGPU 仕様](https://www.w3.org/TR/webgpu/)

## ライセンス

MIT
