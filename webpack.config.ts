import eslintPlugin from "eslint-webpack-plugin";
import htmlWebpackPlugin from "html-webpack-plugin";
import path from "path";
import type webpack from "webpack";
import type { Configuration as WebpackDevServerConfiguration } from "webpack-dev-server";

export default (env: any): webpack.Configuration & { devServer?: WebpackDevServerConfiguration } => ({
    entry: "./src/index.ts",
    output: {
        path: path.join(import.meta.dirname, "/dist"),
        filename: "[name].bundle.js",
        clean: true
    },
    optimization: {
        minimize: env.production,
        splitChunks: {
            chunks: "all",
            cacheGroups: {
                default: false,
                defaultVendors: false,
                deadcode: {
                    test: (module: webpack.Module): boolean => {
                        const resource = (module as webpack.NormalModule).resource?.replaceAll("\\", "/");
                        return resource !== undefined && [
                            // Babylon.js modules pulled in by imports but unused by this viewer
                            "/node_modules/@babylonjs/core/Meshes/mesh.vertexData.functions.js",
                            "/node_modules/@babylonjs/core/Misc/bitArray.js",
                            "/node_modules/@babylonjs/core/Engines/thinEngine.js",

                            // Texture loader entry modules loaded through textureLoaderManager dynamic imports
                            // IES texture loader
                            "/node_modules/@babylonjs/core/Materials/Textures/Loaders/iesTextureLoader.js",
                            "/node_modules/@babylonjs/core/Lights/IES/iesLoader.js",
                            // DDS texture loader
                            "/node_modules/@babylonjs/core/Materials/Textures/Loaders/ddsTextureLoader.js",
                            "/node_modules/@babylonjs/core/Misc/dds.pure.js",
                            // Basis texture loader
                            "/node_modules/@babylonjs/core/Materials/Textures/Loaders/basisTextureLoader.js",
                            "/node_modules/@babylonjs/core/Misc/basis.pure.js",
                            "/node_modules/@babylonjs/core/Misc/basisWorker.js",
                            "/node_modules/@babylonjs/core/Misc/workerPool.js",
                            // ENV texture loader
                            "/node_modules/@babylonjs/core/Materials/Textures/Loaders/envTextureLoader.js",
                            "/node_modules/@babylonjs/core/Materials/Textures/baseTexture.polynomial.pure.js",
                            "/node_modules/@babylonjs/core/Misc/environmentTextureTools.pure.js",
                            "/node_modules/@babylonjs/core/Materials/Textures/textureProcessor.js",
                            "/node_modules/@babylonjs/core/Materials/environmentLighting.defines.js",
                            // HDR texture loader
                            "/node_modules/@babylonjs/core/Materials/Textures/Loaders/hdrTextureLoader.js",
                            "/node_modules/@babylonjs/core/Misc/HighDynamicRange/hdr.js",
                            // KTX texture loader
                            "/node_modules/@babylonjs/core/Materials/Textures/Loaders/ktxTextureLoader.js",
                            "/node_modules/@babylonjs/core/Misc/khronosTextureContainer.js",
                            "/node_modules/@babylonjs/core/Misc/khronosTextureContainer2.js",
                            "/node_modules/@babylonjs/core/Misc/khronosTextureContainer2Worker.js",
                            "/node_modules/@babylonjs/core/Materials/Textures/ktx2decoderTypes.js",
                            // EXR texture loader
                            "/node_modules/@babylonjs/core/Materials/Textures/Loaders/exrTextureLoader.js",
                            "/node_modules/@babylonjs/core/Materials/Textures/Loaders/EXR/",
                            // Shared dependencies split from DDS/ENV texture loader async chunks
                            "/node_modules/@babylonjs/core/Maths/sphericalPolynomial.pure.js",
                            "/node_modules/@babylonjs/core/Misc/HighDynamicRange/cubemapToSphericalPolynomial.js"
                        ].some(file => resource.endsWith(file) || resource.includes(file));
                    },
                    name: "deadcode",
                    minChunks: 1,
                    minSize: 0,
                    priority: 120,
                    enforce: true,
                    reuseExistingChunk: true
                },
                glslShaders: {
                    test: (module: webpack.Module): boolean => {
                        const resource = (module as webpack.NormalModule).resource?.replaceAll("\\", "/").toLowerCase();
                        return resource !== undefined && [
                            "/shaders/"
                        ].some(directory => resource.includes(directory));
                    },
                    name: "glslShaders",
                    minChunks: 1,
                    minSize: 0,
                    priority: 100,
                    enforce: true,
                    reuseExistingChunk: true
                },
                wgslShaders: {
                    chunks: "async",
                    test: (module: webpack.Module): boolean => {
                        const resource = (module as webpack.NormalModule).resource?.replaceAll("\\", "/").toLowerCase();
                        return resource !== undefined && [
                            "/shaderswgsl/"
                        ].some(directory => resource.includes(directory));
                    },
                    name: "wgslShaders",
                    minChunks: 1,
                    minSize: 0,
                    priority: 100,
                    enforce: true,
                    reuseExistingChunk: true
                }
            }
        }
    },
    cache: true,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader"
            },
            {
                test: /\.m?js$/,
                resolve: {
                    fullySpecified: false
                }
            },
            {
                test: /\.html$/,
                loader: "html-loader"
            }
        ]
    },
    resolve: {
        alias: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "@": path.resolve(import.meta.dirname, "src")
        },
        modules: ["src", "node_modules"],
        extensions: [".js", ".jsx", ".ts", ".tsx"],
        fallback: {
            "fs": false,
            "path": false
        }
    },
    plugins: [
        new htmlWebpackPlugin({
            template: "./src/index.html"
        }),
        new eslintPlugin({
            extensions: ["ts", "tsx"],
            fix: true,
            cache: true,
            configType: "flat"
        })
    ],
    devServer: {
        host: "0.0.0.0",
        port: 20310,
        allowedHosts: "all",
        client: {
            logging: "none"
        },
        hot: true,
        watchFiles: ["src/**/*"],
        server: "https",
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "Cross-Origin-Opener-Policy": "same-origin",
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "Cross-Origin-Embedder-Policy": "require-corp"
        },
        compress: true
    },
    stats: {
        warningsFilter: [
            "Circular dependency between chunks with runtime"
        ]
    },
    mode: env.production ? "production" : "development"
});
