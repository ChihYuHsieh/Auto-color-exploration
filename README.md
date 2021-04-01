![Final result](https://user-images.githubusercontent.com/11712079/112948465-ae31eb00-916a-11eb-8edd-09aaace5fc8e.jpg)
# Auto-color-exploration
A photoshop script to automate color explorations for character design. This script automatically extracts colors from your reference images and apply to your design. This script works best with the line art/flat color workflow. Each reference image take about 15 secs to process.

# How to use
1. Download the color_explore.js file.
2. Gather your reference images in a folder.
3. Open your character design .psd file.
4. Make sure you have your flat color layers in a folder named "Flats". Merge layers that you want to be the same color down to one layer.
5. Pixel lock (the brush icon beside lock in the layer panel) the layers that you don't want the colors to change. This could be used for skin, eyes, lips, etc.
6. Select File > Scripts > Browse and click color_explore.js
7. Enter your color extract settings.
9. Locate your reference folder from step 2.
10. The script will create a new flat color folder with new color palette applied. This script only affect normal layers' color. Layers with other blend mode (e.g. multiply/add used for shading) with be left unchanged.
