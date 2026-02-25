# Custom Skybox Setup

Your viewport is currently using the **"sunset" preset skybox**. You can replace it with your own custom 6-face cubemap.

## How to Use Your Custom Skybox

1. **Place 6 sky images here**: `public/sky/`

Required filenames (must be exact):
- `px.png` - Positive X (right face)
- `nx.png` - Negative X (left face)  
- `py.png` - Positive Y (top/sky face)
- `ny.png` - Negative Y (bottom face)
- `pz.png` - Positive Z (front face)
- `nz.png` - Negative Z (back face)

2. **Update SceneCanvas.jsx**

In `src/components/SceneCanvas.jsx`, in the `SceneContent()` function, replace this:

```jsx
<Environment background preset="sunset" />
```

With this:

```jsx
<Environment
  background
  files={[
    "/sky/px.png",
    "/sky/nx.png",
    "/sky/py.png",
    "/sky/ny.png",
    "/sky/pz.png",
    "/sky/nz.png",
  ]}
/>
```

## Image Requirements

- **Format**: PNG, JPG, or WebP  
- **Size**: Square images (512x512, 1024x1024, 2048x2048 recommended)
- **Naming**: Must match the filenames above exactly

## Skybox Face Order Reference

```
        [py]      (top/sky)
         |
[nx] - [pz] - [px] - [nz]
    (left) (front) (right) (back)
         |
        [ny]      (bottom/ground)
```

## Available Presets (Current)

If you want to use a different built-in preset instead of custom images, change:
- `"sunset"` → `"dawn"`, `"night"`, `"warehouse"`, `"forest"`, `"apartment"`, `"studio"`, `"park"`, `"city"`

Example:
```jsx
<Environment background preset="night" />
```

## Troubleshooting Custom Skybox

If your custom skybox appears **rotated or has visible seams**, you may need to:
1. Rotate individual face images 90°, 180°, or 270°
2. Flip faces horizontally or vertically
3. Verify the face order matches the diagram above

Save the changes and reload - your custom skybox will appear in the viewport!

