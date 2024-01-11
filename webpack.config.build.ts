import htmlWebpackPlugin from "html-webpack-plugin";
import path from "path";
import type webpack from "webpack";
import type { Configuration as WebpackDevServerConfiguration } from "webpack-dev-server";

export default (_env: any): webpack.Configuration & { devServer?: WebpackDevServerConfiguration } => ({
    entry: {
        index: "./src/index.ts"
    },
    output: {
        path: path.join(__dirname, "/dist"),
        filename: "[name].bundle.js",
        clean: false
    },
    optimization: {
        minimize: true
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader"
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
            "@": path.resolve(__dirname, "src")
        },
        modules: ["src", "node_modules"],
        extensions: [".js", ".jsx", ".ts", ".tsx"],
        fallback: {
            "url": require.resolve("url/")
        }
    },
    plugins: [
        new htmlWebpackPlugin({
            filename: "index.html",
            template: "./src/index.html",
            chunks: ["index"]
        })
    ],
    mode: "production",
    experiments: {
        asyncWebAssembly: true
    }
});
