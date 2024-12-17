import path, { resolve } from 'path';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
    mode: 'development',
    entry: './src/main.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'public'),

        library: 'mlib',
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    resolve: {
        fallback: {
            "stream": false,
            "string_decoder": false,
        }
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ],
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/,
                type: 'asset/resource', // the asset module treat it as a resource
                generator: {
                    filename: 'assets/images/[name][hash][ext][query]',
                },
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'styles.css',
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/assets/images', to: 'assets/images' }
            ],
        }),
    ],
};